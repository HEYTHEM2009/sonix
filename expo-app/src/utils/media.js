import * as DocumentPicker from "expo-document-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";

const MIME_BY_EXT = {
  pdf: "application/pdf",
  zip: "application/zip",
  rar: "application/x-rar-compressed",
  "7z": "application/x-7z-compressed",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  csv: "text/csv",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

export function getMime(path = "") {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  return MIME_BY_EXT[ext] || "application/octet-stream";
}

export function isDocument(mime = "") {
  if (!mime) return false;
  if (mime.startsWith("text/")) return true;
  return [
    "application/pdf",
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ].includes(mime);
}

export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

export async function pickDocument() {
  try {
    const res = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
    });
    if (res.canceled || !res.assets || res.assets.length === 0) return null;
    const asset = res.assets[0];
    const name = asset.name || asset.uri.split("/").pop() || "file";
    let size = asset.size;
    if (!size) {
      try {
        const info = await FileSystem.getInfoAsync(asset.uri);
        if (info.exists) size = info.size;
      } catch (_) {}
    }
    return {
      uri: asset.uri,
      name,
      mimeType: asset.mimeType || getMime(name),
      size: size || 0,
    };
  } catch (e) {
    console.warn("pickDocument error", e);
    return null;
  }
}

export async function compressImage(uri, { width = 1080, compress = 0.7 } = {}) {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width } }],
      { compress, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch (e) {
    console.warn("compressImage error", e);
    return null;
  }
}

export async function pickImage() {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return null;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (res.canceled || !res.assets?.[0]) return null;
    return res.assets[0];
  } catch (e) {
    console.warn("pickImage error", e);
    return null;
  }
}

export async function pickVideo() {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return null;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["videos"], quality: 0.7 });
    if (res.canceled || !res.assets?.[0]) return null;
    return res.assets[0];
  } catch (e) {
    console.warn("pickVideo error", e);
    return null;
  }
}
