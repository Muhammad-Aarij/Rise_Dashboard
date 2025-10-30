import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

// ====== CONFIG ======
const BASE_URL = "https://api.riseselfesteem.com";
const CLOUDINARY_CLOUD_NAME = "dfvkeqfbf";
const CLOUDINARY_UPLOAD_PRESET = "Rise_App";

// ====== API (same endpoints, axios for progress/errors) ======
const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

async function createResource(resourceData) {
  const { data } = await api.post("/api/resource", resourceData);
  return data;
}
async function getAllResources() {
  const { data } = await api.get("/api/resource");
  return Array.isArray(data) ? data : data?.data || [];
}
async function updateResource(resourceId, resourceData) {
  const { data } = await api.put(`/api/resource/${resourceId}`, resourceData);
  return data;
}
async function deleteResource(resourceId) {
  await api.delete(`/api/resource/${resourceId}`);
  return { success: true };
}

// ====== Utils ======
const clsx = (...xs) => xs.filter(Boolean).join(" ");
const truncate = (s = "", n = 48) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const fmtBytes = (b) => {
  if (!b && b !== 0) return "—";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = b;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(1)} ${u[i]}`;
};

// ====== Small UI bits ======
const Badge = ({ tone = "slate", children }) => {
  const map = {
    slate: "bg-slate-500/20 text-slate-200 border-slate-500/30",
    blue: "bg-blue-500/20 text-blue-200 border-blue-500/30",
    green: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
    red: "bg-rose-500/20 text-rose-200 border-rose-500/30",
    purple: "bg-purple-500/20 text-purple-200 border-purple-500/30",
  };
  return (
    <span className={clsx("inline-flex items-center px-2.5 py-1 rounded-full text-xs border", map[tone])}>
      {children}
    </span>
  );
};

const Toast = ({ type = "info", msg, onClose }) => {
  const tone = {
    success: "bg-emerald-900/30 border-emerald-700/40 text-emerald-200",
    error: "bg-rose-900/30 border-rose-700/40 text-rose-200",
    info: "bg-blue-900/30 border-blue-700/40 text-blue-200",
  }[type];
  return (
    <div className={clsx("mt-4 rounded-lg px-4 py-3 text-sm border", tone)}>
      <div className="flex items-start justify-between gap-3">
        <div>{msg}</div>
        <button onClick={onClose} aria-label="Close" className="opacity-70 hover:opacity-100">
          ✕
        </button>
      </div>
    </div>
  );
};

const SkeletonRows = ({ rows = 6 }) => (
  <div className="overflow-hidden rounded-lg border border-gray-700">
    <div className="bg-gray-700 px-4 py-3 text-gray-200 text-sm font-semibold">Loading…</div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="grid grid-cols-4 gap-4 px-4 py-3 bg-gray-800/40 border-t border-gray-700">
        <div className="h-4 bg-gray-700/70 rounded animate-pulse" />
        <div className="h-4 bg-gray-700/70 rounded animate-pulse" />
        <div className="h-4 bg-gray-700/70 rounded animate-pulse" />
        <div className="h-8 bg-gray-700/70 rounded animate-pulse" />
      </div>
    ))}
  </div>
);

// ====== Confirm Modal ======
const ConfirmModal = ({ open, title, message, confirmText = "Confirm", onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/70 grid place-items-center z-50 p-4">
      <div className="bg-gray-800 text-white w-full max-w-md rounded-xl shadow-2xl border border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h4 className="text-lg font-semibold">{title}</h4>
          <button onClick={onCancel} className="opacity-70 hover:opacity-100">✕</button>
        </div>
        <div className="px-6 py-5 text-sm text-gray-200">{message}</div>
        <div className="px-6 py-4 flex gap-3 justify-end border-t border-gray-700">
          <button onClick={onCancel} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-700">{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

// ====== Cloudinary Upload (axios for progress) ======
async function uploadToCloudinary(file, onProgress) {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const { data } = await axios.post(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
    form,
    {
      onUploadProgress: (evt) => {
        if (!evt.total) return;
        const pct = Math.round((evt.loaded / evt.total) * 100);
        onProgress?.(pct, evt.loaded, evt.total);
      },
    }
  );
  return data?.secure_url;
}

// ====== MAIN ======
const AudioManager = () => {
  const [audios, setAudios] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAudioId, setEditingAudioId] = useState(null);

  const [audioName, setAudioName] = useState("");
  const [audioType, setAudioType] = useState("audioBook"); // 'audioBook' | 'audioSession'
  const [audioPremium, setAudioPremium] = useState(false);  // boolean
  const [audioLink, setAudioLink] = useState("");
  const [audioDescription, setAudioDescription] = useState("");
  const [audioFile, setAudioFile] = useState(null);

  const [uploadPct, setUploadPct] = useState(0);
  const [busy, setBusy] = useState(false);

  const [toast, setToast] = useState(null); // {type,msg}
  const [confirm, setConfirm] = useState({ open: false, id: null, name: "" });

  const showToast = (type, msg) => setToast({ type, msg });
  const clearToast = () => setToast(null);

  const fetchAudios = async () => {
    try {
      setLoading(true);
      const data = await getAllResources();
      const filtered = data.filter((r) => r.type === "audioBook" || r.type === "audioSession");
      const mapped = filtered.map((r) => ({
        id: r._id,
        name: r.title,
        type: r.type,
        isPremium: !!r.isPremium,
        link: r.link,
        description: r.description,
      }));
      setAudios(mapped);
    } catch (err) {
      showToast("error", err?.message || "Failed to load audio library.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setEditingAudioId(null);
    setAudioName("");
    setAudioType("audioBook");
    setAudioPremium(false);
    setAudioLink("");
    setAudioDescription("");
    setAudioFile(null);
    setUploadPct(0);
    clearToast();
    setShowModal(true);
  };

  const openEditModal = (audio) => {
    setIsEditing(true);
    setEditingAudioId(audio.id);
    setAudioName(audio.name);
    setAudioType(audio.type);
    setAudioPremium(!!audio.isPremium);
    setAudioLink(audio.link || "");
    setAudioDescription(audio.description || "");
    setAudioFile(null);
    setUploadPct(0);
    clearToast();
    setShowModal(true);
  };

  const validateBeforeSave = () => {
    if (!audioName.trim() || !audioDescription.trim()) {
      showToast("error", "Please fill in both Name and Description.");
      return false;
    }
    if (!isEditing && !audioFile && !audioLink) {
      showToast("error", "Upload a file or provide a valid audio link.");
      return false;
    }
    if (audioFile) {
      const allowed = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/aac", "audio/x-m4a", "audio/mp4"];
      if (!allowed.includes(audioFile.type)) {
        showToast("error", "Unsupported file type. Use MP3/WAV/OGG/AAC/M4A.");
        return false;
      }
      const maxBytes = 200 * 1024 * 1024; // 200MB
      if (audioFile.size > maxBytes) {
        showToast("error", `File too large (${fmtBytes(audioFile.size)}). Max 200 MB.`);
        return false;
      }
    }
    return true;
  };

  const handleAddOrUpdateAudio = async () => {
    if (!validateBeforeSave()) return;

    setBusy(true);
    clearToast();
    let finalLink = audioLink;

    try {
      if (audioFile) {
        // Upload to Cloudinary with progress
        setUploadPct(0);
        finalLink = await uploadToCloudinary(audioFile, (pct) => setUploadPct(pct));
      }

      const payload = {
        type: audioType,
        link: finalLink,
        isPremium: !!audioPremium,
        title: audioName.trim(),
        description: audioDescription.trim(),
      };

      if (isEditing) {
        await updateResource(editingAudioId, payload);
        showToast("success", "Audio updated successfully.");
      } else {
        await createResource(payload);
        showToast("success", "Audio uploaded successfully.");
      }

      setShowModal(false);
      await fetchAudios();
    } catch (err) {
      showToast("error", err?.message || "Failed to save audio.");
    } finally {
      setBusy(false);
      setUploadPct(0);
    }
  };

  const requestDelete = (id, name) => setConfirm({ open: true, id, name });
  const cancelDelete = () => setConfirm({ open: false, id: null, name: "" });

  const confirmDelete = async () => {
    const { id } = confirm;
    if (!id) return;
    setBusy(true);
    try {
      await deleteResource(id);
      showToast("success", "Audio deleted.");
      await fetchAudios();
    } catch (err) {
      showToast("error", err?.message || "Failed to delete audio.");
    } finally {
      setBusy(false);
      cancelDelete();
    }
  };

  // quick derived stats
  const total = audios.length;
  const paid = audios.filter((a) => a.isPremium).length;

  return (
    <div className="min-h-screen bg-gray-900 p-6 text-white font-sans antialiased">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Audio Library</h2>
          <Badge tone="purple">{total} items</Badge>
          <Badge tone="green">{paid} paid</Badge>
        </div>
        <button
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold transition duration-200"
          onClick={openAddModal}
        >
          + Add New Audio
        </button>
      </div>

      {toast && <Toast type={toast.type} msg={toast.msg} onClose={clearToast} />}

      {/* Table */}
      {loading ? (
        <SkeletonRows rows={6} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-700 shadow-lg">
          <table className="min-w-full table-auto bg-gray-800">
            <thead className="bg-gray-700">
              <tr className="text-left">
                <th className="p-3 text-sm font-semibold uppercase tracking-wider">Audio Name</th>
                <th className="p-3 text-sm font-semibold uppercase tracking-wider">Type</th>
                <th className="p-3 text-sm font-semibold uppercase tracking-wider">Access</th>
                <th className="p-3 text-sm font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {audios.length > 0 ? (
                audios.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-700/50 transition">
                    <td className="p-3">
                      <div className="font-medium">{truncate(a.name, 64)}</div>
                      <div className="text-xs text-gray-400">{truncate(a.description || "—", 96)}</div>
                    </td>
                    <td className="p-3">
                      <Badge tone="blue">{a.type === "audioBook" ? "AudioBook" : "Audio Session"}</Badge>
                    </td>
                    <td className="p-3">
                      {a.isPremium ? <Badge tone="red">Paid</Badge> : <Badge tone="green">Free</Badge>}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-4">
                        {a.link && (
                          <a
                            href={a.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm underline"
                          >
                            Open
                          </a>
                        )}
                        <button
                          onClick={() => openEditModal(a)}
                          className="text-blue-300 hover:text-blue-200 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => requestDelete(a.id, a.name)}
                          className="text-rose-300 hover:text-rose-200 text-sm disabled:opacity-50"
                          disabled={busy}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-6 text-center text-gray-400">
                    No audio files uploaded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Add/Edit */}
     {showModal && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    aria-modal="true"
    role="dialog"
  >
    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      onClick={() => setShowModal(false)}
    />

    {/* Dialog */}
    <div className="relative w-full max-w-xl transform transition-all duration-200 scale-100 opacity-100">
      <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-gradient-to-b from-gray-800 to-gray-900">
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-purple-700/70 via-purple-600/60 to-fuchsia-600/60 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 grid place-items-center rounded-full bg-white/15 text-white">
                🎧
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {isEditing ? "Edit Audio" : "Upload New Audio"}
                </h3>
                <p className="text-xs text-white/80">
                  Fill details below and save your {audioType === "audioBook" ? "audiobook" : "audio session"}.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              aria-label="Close modal"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/90 hover:text-white hover:bg-white/10 border border-white/10 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-2">
          {/* Name */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-3">
            <label className="block text-xs font-semibold tracking-wide text-white/70 mb-2">
              Audio Name
            </label>
            <input
              type="text"
              value={audioName}
              onChange={(e) => setAudioName(e.target.value)}
              placeholder="Enter audio name"
              className="w-full px-3 py-2.5 rounded-lg bg-gray-900/60 text-white placeholder-white/40 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
            />
          </div>

          {/* File Upload */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-3">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold tracking-wide text-white/70">
                Upload Audio File
              </label>
              {audioFile && (
                <span className="text-[11px] text-white/60">
                  {audioFile.name} • {fmtBytes(audioFile.size)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <label className="inline-block cursor-pointer px-4 py-2.5 rounded-lg bg-gray-900/60 border border-white/10 text-sm text-white/90 hover:bg-gray-900/80 transition">
                Select File
                <input
                  type="file"
                  accept=".mp3,.wav,.ogg,.aac,.m4a,.mp4"
                  onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>

              {/* Quick clear file */}
              {audioFile && (
                <button
                  onClick={() => setAudioFile(null)}
                  className="px-3 py-2 rounded-lg border border-white/10 text-xs text-white/80 hover:bg-white/10 transition"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Progress */}
            {uploadPct > 0 && (
              <div className="mt-3">
                <div className="h-2 w-full rounded bg-white/10 overflow-hidden">
                  <div
                    className="h-2 bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all"
                    style={{ width: `${uploadPct}%` }}
                  />
                </div>
                <div className="text-xs mt-1 text-white/70">{uploadPct}%</div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-3">
            <label className="block text-xs font-semibold tracking-wide text-white/70 mb-2">
              Description
            </label>
            <textarea
              rows={3}
              value={audioDescription}
              onChange={(e) => setAudioDescription(e.target.value)}
              placeholder="Brief description of the audio file"
              className="w-full px-3 py-2.5 rounded-lg bg-gray-900/60 text-white placeholder-white/40 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/60 resize-y"
            />
          </div>

          {/* Type + Access */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <label className="block text-xs font-semibold tracking-wide text-white/70 mb-2">
                Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setAudioType("audioBook")}
                  className={clsx(
                    "py-2.5 rounded-lg font-semibold text-sm transition border",
                    audioType === "audioBook"
                      ? "bg-blue-600 text-white border-blue-500/50"
                      : "bg-gray-900/60 text-white/85 border-white/10 hover:bg-blue-700/30 hover:border-blue-500/40"
                  )}
                >
                  AudioBook
                </button>
                <button
                  onClick={() => setAudioType("audioSession")}
                  className={clsx(
                    "py-2.5 rounded-lg font-semibold text-sm transition border",
                    audioType === "audioSession"
                      ? "bg-blue-600 text-white border-blue-500/50"
                      : "bg-gray-900/60 text-white/85 border-white/10 hover:bg-blue-700/30 hover:border-blue-500/40"
                  )}
                >
                  Audio Session
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <label className="block text-xs font-semibold tracking-wide text-white/70 mb-2">
                Access
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setAudioPremium(false)}
                  className={clsx(
                    "py-2.5 rounded-lg font-semibold text-sm transition border",
                    audioPremium === false
                      ? "bg-emerald-600 text-white border-emerald-500/50"
                      : "bg-gray-900/60 text-white/85 border-white/10 hover:bg-emerald-700/30 hover:border-emerald-500/40"
                  )}
                >
                  Free
                </button>
                <button
                  onClick={() => setAudioPremium(true)}
                  className={clsx(
                    "py-2.5 rounded-lg font-semibold text-sm transition border",
                    audioPremium === true
                      ? "bg-rose-600 text-white border-rose-500/50"
                      : "bg-gray-900/60 text-white/85 border-white/10 hover:bg-rose-700/30 hover:border-rose-500/40"
                  )}
                >
                  Paid
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-900/60 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 rounded-lg bg-gray-900/60 text-white/90 border border-white/10 hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleAddOrUpdateAudio}
            disabled={busy}
            className={clsx(
              "px-4 py-2 rounded-lg text-white font-semibold shadow transition disabled:opacity-60",
              "bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500"
            )}
          >
            {busy ? "Processing..." : isEditing ? "Update Audio" : "Upload Audio"}
          </button>
        </div>
      </div>
    </div>
  </div>
)}


      {/* Confirm delete */}
      <ConfirmModal
        open={confirm.open}
        title="Delete Audio"
        message={
          <>
            Are you sure you want to delete{" "}
            <span className="font-semibold">{confirm.name || "this audio"}</span>?
            <br />
            This action cannot be undone.
          </>
        }
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};

export default AudioManager;
