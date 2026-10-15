'use client';

import { useRef, useState } from 'react';
import { Alert, Box, Button, LinearProgress, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { FormHelperText } from '@mui/material';
import { formatBytes, uploadFilesXHR } from '@/lib/upload';

export interface UploadedAsset {
  url: string;
  fileName: string;
  mime: string;
  sizeBytes: number;
}

/**
 * File-backed artwork field — the single replacement for pasted image URLs.
 * Uploads through `uploadUrl` (multipart XHR with progress), previews the
 * result, and hands the served URL back via `onChange`. Used by category
 * artwork today, brand logos and CMS blocks next.
 */
export function AssetUploadField({
  label,
  hint,
  value,
  onChange,
  uploadUrl,
  uploadField = 'file',
  uploadExtra,
  accept = 'image/jpeg,image/png,image/webp,image/avif,image/gif',
  maxBytes = 10 * 1024 * 1024,
  disabled = false,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
  uploadUrl: string;
  uploadField?: string;
  uploadExtra?: Record<string, string>;
  accept?: string;
  maxBytes?: number;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [percent, setPercent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<(() => void) | null>(null);

  const pick = (f: File | undefined) => {
    if (!f || disabled) return;
    setError(null);
    if (f.size === 0) {
      setError(`"${f.name}" is empty.`);
      return;
    }
    if (f.size > maxBytes) {
      setError(`"${f.name}" exceeds the ${formatBytes(maxBytes)} limit.`);
      return;
    }
    setPercent(0);
    const { promise, abort: cancel } = uploadFilesXHR<UploadedAsset>({
      url: uploadUrl,
      files: [f],
      field: uploadField,
      extra: uploadExtra,
      onProgress: (p) => setPercent(p.percent),
    });
    abort.current = cancel;
    promise.then(
      (asset) => {
        setPercent(null);
        abort.current = null;
        onChange(asset.url);
      },
      (e: Error) => {
        setPercent(null);
        abort.current = null;
        setError(e.message);
      },
    );
  };

  return (
    <Box>
      <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, mb: 0.5 }}>{label}</Typography>
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          alignItems: 'center',
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          p: 1.25,
          bgcolor: 'action.hover',
        }}
      >
        {value ? (
          // Same-origin /uploads/* resolves through the Next rewrite.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} />
        ) : (
          <Box sx={{ width: 72, height: 72, borderRadius: 2, bgcolor: 'background.paper', display: 'grid', placeItems: 'center', color: 'text.disabled' }}>
            <CloudUploadIcon />
          </Box>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {value ? value.split('/').pop() : 'No file yet'}
          </Typography>
          {percent !== null ? (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
              <LinearProgress variant="determinate" value={percent} sx={{ flex: 1 }} />
              <Typography variant="caption">{percent}%</Typography>
              <Button size="small" onClick={() => abort.current?.()}>Cancel</Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
              <Button size="small" variant="outlined" disabled={disabled} onClick={() => input.current?.click()}>
                {value ? 'Replace' : 'Upload file'}
              </Button>
              {value ? (
                <Button size="small" color="error" startIcon={<DeleteIcon fontSize="small" />} disabled={disabled} onClick={() => onChange('')}>
                  Remove
                </Button>
              ) : null}
            </Box>
          )}
          <input
            ref={input}
            type="file"
            hidden
            accept={accept}
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </Box>
      </Box>
      {hint ? <FormHelperText>{hint}</FormHelperText> : null}
      {error ? (
        <Alert severity="error" sx={{ mt: 0.75 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}
    </Box>
  );
}
