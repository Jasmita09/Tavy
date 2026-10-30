import React, { useEffect, useId, useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { Dialog } from './Dialog';
import { Polaroid } from './Polaroid';
import { buttonClass } from '../ui/Button';
import { ACCEPTED_TYPES, MemoryStoreError, errorMessage, preparePhoto, type Memory, type MemoryDraft } from './memoryStore';

const TITLE_MAX = 80;
const NOTE_MAX = 600;

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

interface MemoryEditorProps {
  memory?: Memory;
  currentPhotoUrl?: string;
  onSave: (draft: MemoryDraft) => Promise<void>;
  onClose: () => void;
}

const field = `w-full rounded-tv-sm border border-tv-line bg-white px-3.5 py-2.5 text-tv-navy placeholder:text-tv-slate/70 focus:outline-none focus:ring-2 focus:ring-tv-accent-ink`;

export const MemoryEditor: React.FC<MemoryEditorProps> = ({ memory, currentPhotoUrl, onSave, onClose }) => {
  const [title, setTitle] = useState(memory?.title ?? '');
  const [date, setDate] = useState(memory?.date ?? today());
  const [note, setNote] = useState(memory?.note ?? '');
  /** undefined: keep the stored photo; null: remove it; Blob: the new photo. */
  const [photo, setPhoto] = useState<Blob | null | undefined>(undefined);
  const [preview, setPreview] = useState<string | undefined>(currentPhotoUrl);
  const [photoError, setPhotoError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [preparing, setPreparing] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const ids = { title: useId(), date: useId(), note: useId(), photo: useId(), noteCount: useId() };

  // Revoke preview URLs this dialog created
  useEffect(() => () => {
    if (preview && preview !== currentPhotoUrl) URL.revokeObjectURL(preview);
  }, [preview, currentPhotoUrl]);

  const choosePhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhotoError('');
    setPreparing(true);
    try {
      const blob = await preparePhoto(file);
      setPhoto(blob);
      setPreview(URL.createObjectURL(blob));
    } catch (e) {
      setPhotoError(e instanceof MemoryStoreError ? e.message : errorMessage('unreadable'));
    } finally {
      setPreparing(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      titleRef.current?.focus();
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      await onSave({ title, date, note, photo });
    } catch (err) {
      setSaveError(err instanceof MemoryStoreError ? err.message : errorMessage('unknown'));
      setSaving(false);
    }
  };

  return (
    <Dialog title={memory ? 'Edit memory' : 'New memory'} busy={saving} onClose={onClose} initialFocus={titleRef}>
      <form onSubmit={submit} noValidate className="space-y-5">
        {/* Photo */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-5">
          <div className="w-40 shrink-0">
            <Polaroid src={preview} caption={title || 'Your moment'} tilt={-2} small />
          </div>
          <div className="w-full space-y-2">
            <p id={ids.photo} className="text-sm font-medium text-tv-navy">
              Photo <span className="font-normal text-tv-slate">(optional)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <label className={`${buttonClass('secondary')} ${preparing ? 'opacity-60' : ''} focus-within:ring-2 focus-within:ring-tv-accent-ink`}>
                <ImagePlus className="w-4 h-4" aria-hidden="true" />
                {preparing ? 'Preparing…' : preview ? 'Replace photo' : 'Choose a photo'}
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPTED_TYPES.join(',')}
                  aria-describedby={ids.photo}
                  className="sr-only"
                  disabled={preparing || saving}
                  onChange={(e) => choosePhoto(e.target.files?.[0])}
                />
              </label>
              {preview && (
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(null);
                    setPreview(undefined);
                  }}
                  className={buttonClass('ghost')}
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  Remove photo
                </button>
              )}
            </div>
            <p className="text-xs leading-relaxed text-tv-slate">JPEG, PNG, WebP or GIF up to 15 MB. Resized and kept on this device only.</p>
            {photoError && (
              <p role="alert" className="text-sm font-medium text-[#9b2c2c]">
                {photoError}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor={ids.title} className="text-sm font-medium text-tv-navy">
            Title
          </label>
          <input
            ref={titleRef}
            id={ids.title}
            value={title}
            maxLength={TITLE_MAX}
            required
            onChange={(e) => setTitle(e.target.value)}
            placeholder="First encore in the rain"
            className={field}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor={ids.date} className="text-sm font-medium text-tv-navy">
            Date
          </label>
          <input id={ids.date} type="date" value={date} required onChange={(e) => setDate(e.target.value)} className={field} />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <label htmlFor={ids.note} className="text-sm font-medium text-tv-navy">
              Note
            </label>
            <span id={ids.noteCount} className="text-xs text-tv-slate">
              {note.length}/{NOTE_MAX}
            </span>
          </div>
          <textarea
            id={ids.note}
            value={note}
            maxLength={NOTE_MAX}
            rows={4}
            aria-describedby={ids.noteCount}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What did it feel like? Who were you with?"
            className={`${field} resize-y`}
          />
        </div>

        {saveError && (
          <p role="alert" className="rounded-tv-sm border border-[#e7c1c1] bg-[#fdf2f2] px-3.5 py-2.5 text-sm text-[#7f1d1d]">
            {saveError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={saving} className={buttonClass('ghost')}>
            Cancel
          </button>
          <button type="submit" disabled={saving || preparing || !title.trim() || !date} className={buttonClass('primary')}>
            {saving ? 'Saving…' : memory ? 'Save changes' : 'Save to Memory Book'}
          </button>
        </div>
      </form>
    </Dialog>
  );
};
