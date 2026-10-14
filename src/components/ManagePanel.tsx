import { useState } from 'react';
import { HABIT_EMOJIS } from '../types';

export function ManagePanel({
  habits, pendingRemovals, onAdd, onEdit, onScheduleRemoval, onCancelRemoval, onClose,
}: {
  habits: Array<{ id: string; name: string; emoji: string }>;
  pendingRemovals: string[];
  onAdd: (name: string, emoji: string) => void;
  onEdit: (id: string, name: string, emoji: string) => void;
  onScheduleRemoval: (id: string) => void;
  onCancelRemoval: (id: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('💪');

  const [editingId, setEditingId]   = useState<string | null>(null);
  const [draftName, setDraftName]   = useState('');
  const [draftEmoji, setDraftEmoji] = useState('💪');

  function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed, emoji);
    setName('');
  }

  function startEdit(h: { id: string; name: string; emoji: string }) {
    setEditingId(h.id);
    setDraftName(h.name);
    setDraftEmoji(h.emoji);
  }

  function saveEdit() {
    const trimmed = draftName.trim();
    if (trimmed && editingId) onEdit(editingId, trimmed, draftEmoji);
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-lg bg-slate-900 rounded-t-3xl md:rounded-2xl border-t md:border border-slate-700 shadow-2xl panel-slide"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 bg-slate-700 rounded-full" />
        </div>

        <div className="px-5 pb-8 max-h-[82vh] overflow-y-auto">
          <div className="flex items-center justify-between pt-4 md:pt-5 mb-4">
            <h2 className="text-white font-bold text-2xl">🤿 Mission Control</h2>
            <button
              onClick={onClose}
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 transition-all text-xl leading-none"
            >
              ✕
            </button>
          </div>

          {/* Add new */}
          <div className="bg-slate-800 rounded-2xl p-4 mb-5 border border-slate-700">
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-3">New Objective</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {HABIT_EMOJIS.map(em => (
                <button
                  key={em}
                  onClick={() => setEmoji(em)}
                  className={`text-xl w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 ${
                    emoji === em
                      ? 'bg-cyan-500/20 border-2 border-cyan-500 scale-110'
                      : 'bg-slate-700 border-2 border-transparent hover:border-slate-500'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-slate-700 text-white rounded-xl px-4 py-3 placeholder-slate-500 outline-none border border-slate-600 focus:border-cyan-500 transition-colors text-base"
                placeholder="Objective name…"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
                maxLength={40}
              />
              <button
                onClick={handleAdd}
                disabled={!name.trim()}
                className="px-4 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Existing habits */}
          <div>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-3">
              Active Objectives ({habits.length})
            </p>
            {habits.length === 0 ? (
              <p className="text-slate-600 text-center py-6">No objectives yet.</p>
            ) : (
              <div className="space-y-2">
                {habits.map(h => {
                  const isPending = pendingRemovals.includes(h.id);
                  const isEditing = editingId === h.id;

                  if (isEditing) {
                    return (
                      <div key={h.id} className="bg-slate-800 border border-cyan-600/50 rounded-xl p-3">
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {HABIT_EMOJIS.map(em => (
                            <button
                              key={em}
                              onClick={() => setDraftEmoji(em)}
                              className={`text-lg w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                                draftEmoji === em
                                  ? 'bg-cyan-500/20 border-2 border-cyan-500 scale-110'
                                  : 'bg-slate-700 border-2 border-transparent hover:border-slate-600'
                              }`}
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            autoFocus
                            className="flex-1 bg-slate-700 text-white rounded-xl px-3 py-2 outline-none border border-cyan-500 text-base"
                            value={draftName}
                            onChange={e => setDraftName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                            maxLength={40}
                          />
                          <button
                            onClick={saveEdit}
                            disabled={!draftName.trim()}
                            className="px-3 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-bold rounded-xl text-base transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-xl text-base transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={h.id}
                      className={`flex items-center gap-3 rounded-xl p-3 border ${
                        isPending
                          ? 'bg-slate-800/50 border-slate-700/50 opacity-60'
                          : 'bg-slate-800 border-slate-700'
                      }`}
                    >
                      <span className="text-3xl leading-none">{h.emoji}</span>
                      <span className={`font-medium flex-1 text-base ${isPending ? 'text-slate-500 line-through' : 'text-white'}`}>
                        {h.name}
                      </span>
                      {!isPending && (
                        <button
                          onClick={() => startEdit(h)}
                          className="text-slate-400 hover:text-cyan-400 hover:bg-slate-700 w-8 h-8 rounded-lg flex items-center justify-center transition-all text-base flex-shrink-0"
                          title="Edit objective"
                        >
                          ✏️
                        </button>
                      )}
                      {isPending ? (
                        <button
                          onClick={() => onCancelRemoval(h.id)}
                          className="text-sm text-cyan-400 hover:text-cyan-300 border border-cyan-800/60 hover:border-cyan-600 rounded-lg px-2 py-1 transition-all flex-shrink-0"
                        >
                          Undo
                        </button>
                      ) : (
                        <button
                          onClick={() => onScheduleRemoval(h.id)}
                          className="text-red-500 hover:text-red-400 hover:bg-red-950/40 w-8 h-8 rounded-lg flex items-center justify-center transition-all text-lg font-bold flex-shrink-0"
                          title="Remove from tomorrow"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {pendingRemovals.length > 0 && (
              <p className="text-slate-600 text-sm mt-3 text-center">
                Strikethrough objectives will be removed at the start of tomorrow.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
