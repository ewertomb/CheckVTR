
/**
 * Google Drive Service para FleetGuard Pro
 * Gerencia a pasta raiz, banco de dados JSON e upload de fotos.
 */

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

export class GoogleDriveService {
  private tokenClient: any;
  private accessToken: string | null = null;
  private rootFolderName = "FleetGuardPro_Storage";
  private dbFileName = "database.json";
  private photosFolderName = "Vehicle_Photos";

  async init(clientId: string) {
    return new Promise<void>((resolve) => {
      // @ts-ignore
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.error !== undefined) throw response;
          this.accessToken = response.access_token;
          resolve();
        },
      });
    });
  }

  authenticate() {
    this.tokenClient.requestAccessToken({ prompt: 'consent' });
  }

  async findOrCreateFolder(name: string, parentId?: string) {
    const q = `name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false ${parentId ? `and '${parentId}' in parents` : ''}`;
    let response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });
    let data = await response.json();

    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }

    // Create new folder
    const metadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : []
    };

    response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata)
    });
    const folder = await response.json();
    return folder.id;
  }

  async saveFile(name: string, content: string, mimeType: string, parentId: string) {
    // Check if file exists
    const q = `name = '${name}' and '${parentId}' in parents and trashed = false`;
    let response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });
    let data = await response.json();

    const metadata = {
      name: name,
      parents: [parentId]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: mimeType }));

    if (data.files && data.files.length > 0) {
      // Update existing
      const fileId = data.files[0].id;
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${this.accessToken}` },
        body: form
      });
      return fileId;
    } else {
      // Create new
      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.accessToken}` },
        body: form
      });
      const file = await res.json();
      return file.id;
    }
  }

  async getFileContent(name: string, parentId: string) {
    const q = `name = '${name}' and '${parentId}' in parents and trashed = false`;
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });
    const data = await response.json();
    if (!data.files || data.files.length === 0) return null;

    const fileId = data.files[0].id;
    const contentResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });
    return contentResponse.json();
  }

  async uploadPhoto(base64: string, name: string, folderId: string) {
    const byteString = atob(base64.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: 'image/jpeg' });
    
    const metadata = {
      name: `${name}.jpg`,
      parents: [folderId]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.accessToken}` },
      body: form
    });
    return await response.json();
  }

  isConnected() {
    return !!this.accessToken;
  }
}

export const driveService = new GoogleDriveService();
