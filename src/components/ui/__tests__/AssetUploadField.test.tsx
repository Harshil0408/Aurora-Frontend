import * as React from 'react';
import { renderWithProviders, screen, userEvent } from '@/test-utils';
import { AssetUploadField } from '../AssetUploadField';
import { uploadFilesXHR } from '@/lib/upload';

jest.mock('@/lib/upload', () => ({
  ...jest.requireActual('@/lib/upload'),
  uploadFilesXHR: jest.fn(),
}));

const mockedUpload = uploadFilesXHR as jest.Mock;

describe('AssetUploadField (file-backed artwork, never pasted URLs)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the empty state and previews the served file', async () => {
    const onChange = jest.fn();
    const { rerender } = renderWithProviders(
      <AssetUploadField label="Category image" value="" onChange={onChange} uploadUrl="/admin/uploads" />,
    );
    expect(screen.getByText('No file yet')).toBeInTheDocument();

    rerender(
      <AssetUploadField label="Category image" value="/uploads/platform/categories/a.png" onChange={onChange} uploadUrl="/admin/uploads" />,
    );
    expect(screen.getByText('a.png')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Remove'));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('uploads the picked file and hands back the served URL', async () => {
    const onChange = jest.fn();
    mockedUpload.mockReturnValue({
      promise: Promise.resolve({ url: '/uploads/platform/categories/b.png' }),
      abort: jest.fn(),
    });
    function Harness() {
      const [value, setValue] = React.useState('');
      return (
        <AssetUploadField
          label="Category image"
          value={value}
          onChange={(u) => {
            onChange(u);
            setValue(u);
          }}
          uploadUrl="/admin/uploads"
        />
      );
    }
    renderWithProviders(<Harness />);
    const file = new File(['bytes'], 'photo.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file);
    expect(mockedUpload).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/admin/uploads', field: 'file' }),
    );
    expect(await screen.findByText('b.png')).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith('/uploads/platform/categories/b.png');
  });

  it('rejects oversized files client-side without uploading', async () => {
    const onChange = jest.fn();
    renderWithProviders(
      <AssetUploadField label="Category image" value="" onChange={onChange} uploadUrl="/admin/uploads" maxBytes={10} />,
    );
    const file = new File(['01234567890123456789'], 'big.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file);
    expect(mockedUpload).not.toHaveBeenCalled();
    expect(await screen.findByText(/exceeds the 10 B limit/)).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});
