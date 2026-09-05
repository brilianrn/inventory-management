'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/shared/ui/page-scaffold';
import { Modal } from '@/shared/ui/overlays';
import { TextField } from '@/shared/ui/inputs';

export default function NoteComposer({
  isOpen,
  title,
  description,
  presets = [],
  initialNote = '',
  confirmLabel = 'Konfirmasi',
  isProcessing = false,
  onSubmit,
  onClose,
}) {
  const [note, setNote] = useState(initialNote);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const submit = () => {
    if (!note.trim()) {
      setError('Catatan tidak boleh kosong');
      return;
    }
    onSubmit(note.trim());
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={title}
      description={description}
      width="max-w-md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Batal
          </Button>
          <Button onClick={submit} disabled={isProcessing}>
            {isProcessing ? 'Memproses…' : confirmLabel}
          </Button>
        </>
      }
    >
      {presets.length ? (
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Catatan siap pakai
          </p>
          <RadioGroup
            value={presets.some((preset) => preset.text === note) ? note : ''}
            onValueChange={(value) => {
              setNote(value);
              setError(null);
            }}
            className="gap-1.5 rounded-lg border p-3"
          >
            {presets.map((preset) => (
              <Label key={preset.id} className="flex items-start gap-2.5 font-normal">
                <RadioGroupItem value={preset.text} className="mt-0.5" />
                <span className="text-sm text-body">{preset.text}</span>
              </Label>
            ))}
          </RadioGroup>
        </div>
      ) : null}

      <TextField
        label="Catatan"
        value={note}
        error={error}
        placeholder="Tulis catatan"
        onChange={(event) => {
          setNote(event.target.value);
          setError(null);
        }}
      />
    </Modal>
  );
}
