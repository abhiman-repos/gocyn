"use client";

import { ChangeEvent, DragEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";

const API = process.env.NEXT_PUBLIC_APP_URL;
const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
]);
const COURSE_CATEGORIES = [
  "Web Development",
  "Mobile Development",
  "Data Science",
  "AI & Machine Learning",
  "Cloud Computing",
  "DevOps",
  "Cybersecurity",
  "UI/UX Design",
  "Digital Marketing",
  "Business & Entrepreneurship",
  "Personal Development",
];
const COURSE_PRICES = [
  0, 299, 499, 799, 999, 1199, 1499, 1999, 2499, 2999, 3999, 4999, 5999, 6999,
  7999, 8999, 9999,
];
type CourseDraft = {
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  price: string;
  learning: string;
  prerequisites: string;
  certificate_delivery: "automatic" | "manual";
};

function instructorHeaders(json = false): HeadersInit {
  const token = localStorage.getItem("mentorToken");
  if (!token) throw new Error("Instructor session expired. Sign in again.");
  return {
    Authorization: `Bearer ${token}`,
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}
async function responseData(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      data.detail ||
        data.message ||
        JSON.stringify(data) ||
        `Request failed (${response.status}).`,
    );
  return data;
}
const fileKey = (file: File) =>
  `${file.name}:${file.size}:${file.lastModified}`;
function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return (
    `${hours ? `${hours} hr ` : ""}${minutes ? `${minutes} min ` : ""}${seconds ? `${seconds} sec` : ""}`.trim() ||
    "0 sec"
  );
}
type Transfer = {
  fileName: string;
  loaded: number;
  total: number;
  speed: number;
  eta: number;
};
type VideoMetadata = {
  loading: boolean;
  durationSeconds?: number;
  width?: number;
  height?: number;
  thumbnail?: File;
  previewUrl?: string;
  playbackUrl?: string;
  previewUnsupported?: boolean;
  error?: string;
};

const YOUTUBE_RATIO = 16 / 9;
const RATIO_TOLERANCE = 0.03;
function isYouTubeLandscape(width: number, height: number) {
  return width > height && Math.abs(width / height - YOUTUBE_RATIO) <= RATIO_TOLERANCE;
}

function inspectImage(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      const dimensions = { width: image.naturalWidth, height: image.naturalHeight };
      URL.revokeObjectURL(url);
      if (!isYouTubeLandscape(dimensions.width, dimensions.height)) {
        reject(new Error("Use a landscape 16:9 thumbnail, such as 1280 × 720. Shorts and portrait images aren’t supported."));
        return;
      }
      resolve(dimensions);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This image could not be read. Choose a valid 16:9 JPG, PNG, or WebP file."));
    };
    image.src = url;
  });
}

function readU32(view: DataView, offset: number) {
  return view.getUint32(offset, false);
}

async function readVideoDimensionsFromContainer(file: File): Promise<{ width: number; height: number } | null> {
  const readHeader = async (offset: number) => {
    const bytes = await file.slice(offset, offset + 16).arrayBuffer();
    if (bytes.byteLength < 8) return null;
    const view = new DataView(bytes);
    const type = String.fromCharCode(...new Uint8Array(bytes, 4, 4));
    let size = readU32(view, 0);
    let headerSize = 8;
    if (size === 1) {
      if (bytes.byteLength < 16) return null;
      const largeSize = view.getBigUint64(8, false);
      if (largeSize > BigInt(Number.MAX_SAFE_INTEGER)) return null;
      size = Number(largeSize);
      headerSize = 16;
    } else if (size === 0) {
      size = file.size - offset;
    }
    if (size < headerSize || offset + size > file.size) return null;
    return { type, size, headerSize };
  };

  // MP4/MOV dimensions are stored in the track header, independent of codec support.
  let offset = 0;
  while (offset + 8 <= file.size) {
    const box = await readHeader(offset);
    if (!box) break;
    if (box.type === "moov" && box.size <= 64 * 1024 * 1024) {
      const bytes = await file.slice(offset + box.headerSize, offset + box.size).arrayBuffer();
      const view = new DataView(bytes);
      const findTrackSize = (start: number, end: number): { width: number; height: number } | null => {
        let cursor = start;
        while (cursor + 8 <= end) {
          let childSize = readU32(view, cursor);
          const childType = String.fromCharCode(...new Uint8Array(bytes, cursor + 4, 4));
          let childHeader = 8;
          if (childSize === 1) {
            if (cursor + 16 > end) break;
            const bigSize = view.getBigUint64(cursor + 8, false);
            if (bigSize > BigInt(Number.MAX_SAFE_INTEGER)) break;
            childSize = Number(bigSize);
            childHeader = 16;
          } else if (childSize === 0) childSize = end - cursor;
          if (childSize < childHeader || cursor + childSize > end) break;
          if (childType === "tkhd" && childSize >= childHeader + 8) {
            const width = view.getUint32(cursor + childSize - 8, false) / 65536;
            const height = view.getUint32(cursor + childSize - 4, false) / 65536;
            if (width > 0 && height > 0) return { width: Math.round(width), height: Math.round(height) };
          }
          if (["trak", "mdia", "minf"].includes(childType)) {
            const nested = findTrackSize(cursor + childHeader, cursor + childSize);
            if (nested) return nested;
          }
          cursor += childSize;
        }
        return null;
      };
      const dimensions = findTrackSize(0, bytes.byteLength);
      if (dimensions) return dimensions;
    }
    offset += box.size;
  }

  // AVI stores width and height in its small avih header near the start of the file.
  if (/\.avi$/i.test(file.name)) {
    const bytes = await file.slice(0, Math.min(file.size, 4 * 1024 * 1024)).arrayBuffer();
    const data = new Uint8Array(bytes);
    const marker = [0x61, 0x76, 0x69, 0x68]; // avih
    for (let index = 0; index + 48 <= data.length; index++) {
      if (marker.every((byte, offset) => data[index + offset] === byte)) {
        const view = new DataView(bytes);
        const width = view.getUint32(index + 8 + 32, true);
        const height = view.getUint32(index + 8 + 36, true);
        if (width && height) return { width, height };
      }
    }
  }
  return null;
}

async function inspectVideo(
  file: File,
): Promise<{ durationSeconds?: number; width: number; height: number; thumbnail?: File; previewUrl?: string; previewUnsupported?: boolean }> {
  const sourceUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;
  video.src = sourceUrl;
  try {
    let browserDecodedMetadata = true;
    try {
      await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () =>
          reject(new Error("Browser could not decode video metadata."));
      });
    } catch {
      browserDecodedMetadata = false;
    }
    const dimensions = video.videoWidth && video.videoHeight
      ? { width: video.videoWidth, height: video.videoHeight }
      : await readVideoDimensionsFromContainer(file);
    if (!dimensions)
      throw new Error("Couldn’t read this video’s dimensions to verify its aspect ratio. Try a standard MP4/MOV with H.264 video, or re-export it as 16:9 (1920 × 1080).");
    const durationSeconds = Number.isFinite(video.duration) && video.duration > 0
      ? Math.round(video.duration)
      : undefined;
    if (!isYouTubeLandscape(dimensions.width, dimensions.height)) {
      throw new Error(`Use a landscape 16:9 video (for example, 1920 × 1080). This file is ${dimensions.width} × ${dimensions.height}; portrait and Shorts-style videos aren’t supported.`);
    }
    let thumbnail: File | undefined;
    let previewUrl: string | undefined;
    if (browserDecodedMetadata && video.videoWidth && video.videoHeight) {
      try {
        if (durationSeconds) {
          const seekTime = Math.min(1, video.duration / 2);
          if (seekTime > 0) {
            await new Promise<void>((resolve, reject) => {
              video.onseeked = () => resolve();
              video.onerror = () => reject(new Error("Could not preview a frame."));
              video.currentTime = seekTime;
            });
          }
        } else {
          throw new Error("Duration unavailable; use a course cover image instead.");
        }
        const canvas = document.createElement("canvas");
        canvas.width = 480;
        canvas.height = 270;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Could not create a video thumbnail.");
        const sourceRatio = video.videoWidth / video.videoHeight;
        let cropX = 0;
        let cropY = 0;
        let cropWidth = video.videoWidth;
        let cropHeight = video.videoHeight;
        if (sourceRatio > YOUTUBE_RATIO) {
          cropWidth = video.videoHeight * YOUTUBE_RATIO;
          cropX = (video.videoWidth - cropWidth) / 2;
        } else {
          cropHeight = video.videoWidth / YOUTUBE_RATIO;
          cropY = (video.videoHeight - cropHeight) / 2;
        }
        context.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
          result => result ? resolve(result) : reject(new Error("Could not create a video thumbnail.")),
          "image/jpeg",
          0.86,
        ));
        thumbnail = new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "video"}-thumbnail.jpg`, { type: "image/jpeg" });
        previewUrl = canvas.toDataURL("image/jpeg", 0.86);
      } catch {
        // A valid 16:9 video remains uploadable when the browser cannot extract a frame.
      }
    }
    return {
      durationSeconds,
      width: dimensions.width,
      height: dimensions.height,
      thumbnail,
      previewUrl,
      previewUnsupported: !browserDecodedMetadata,
    };
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(sourceUrl);
  }
}

function putPart(
  url: string,
  body: Blob,
  onProgress: (loaded: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded);
    };
    request.onload = () => {
      if (request.status < 200 || request.status >= 300)
        return reject(
          new Error(`Storage rejected the video part (${request.status}).`),
        );
      const etag =
        request.getResponseHeader("ETag") || request.getResponseHeader("etag");
      if (!etag)
        return reject(
          new Error(
            "Storage did not return the video part ETag. Check the bucket CORS ExposeHeaders configuration.",
          ),
        );
      resolve(etag);
    };
    request.onerror = () =>
      reject(
        new Error(
          "The browser could not reach video storage. Make sure Docker/Floci is running, the course media bucket was initialized, and the frontend origin is allowed by COURSE_UPLOAD_ALLOWED_ORIGINS.",
        ),
      );
    request.onabort = () => reject(new Error("Video upload was cancelled."));
    request.send(body);
  });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatEta(seconds: number) {
  if (!Number.isFinite(seconds)) return "Calculating…";
  if (seconds < 60) return `${Math.ceil(seconds)} sec`;
  const minutes = Math.ceil(seconds / 60);
  return `${Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)} hr ` : ""}${minutes % 60 ? `${minutes % 60} min` : ""}`.trim();
}

export interface CourseUploadStepperProps {
  onClose?: () => void;
  onComplete?: () => void;
}

export default function CourseUploadStepper({
  onClose,
  onComplete,
}: CourseUploadStepperProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const playbackUrls = useRef(new Set<string>());
  const [draft, setDraft] = useState<CourseDraft>({
    title: "",
    description: "",
    category: "",
    level: "Beginner",
    duration: "",
    price: "0",
    learning: "",
    prerequisites: "",
    certificate_delivery: "manual",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [lessonTitles, setLessonTitles] = useState<Record<string, string>>({});
  const [lessonOrders, setLessonOrders] = useState<Record<string, number>>({});
  const [previewLesson, setPreviewLesson] = useState("");
  const [courseMaterials, setCourseMaterials] = useState<File[]>([]);
  const [uploadedMaterials, setUploadedMaterials] = useState<string[]>([]);
  const [videoMetadata, setVideoMetadata] = useState<
    Record<string, VideoMetadata>
  >({});
  const [courseThumbnail, setCourseThumbnail] = useState<File | null>(null);
  const [courseThumbnailPreview, setCourseThumbnailPreview] = useState("");
  const [courseThumbnailUploaded, setCourseThumbnailUploaded] = useState(false);
  const [thumbnailChecking, setThumbnailChecking] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [completed, setCompleted] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [videoDragActive, setVideoDragActive] = useState(false);

  useEffect(() => () => {
    playbackUrls.current.forEach((url) => URL.revokeObjectURL(url));
    playbackUrls.current.clear();
  }, []);

  useEffect(() => {
    if (!courseThumbnail) {
      setCourseThumbnailPreview("");
      return;
    }
    const url = URL.createObjectURL(courseThumbnail);
    setCourseThumbnailPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [courseThumbnail]);

  useEffect(() => {
    if (files.length === 0) {
      setDraft((current) => ({ ...current, duration: "" }));
      return;
    }
    const total = files.reduce(
      (sum, file) => sum + (videoMetadata[fileKey(file)]?.durationSeconds || 0),
      0,
    );
    if (total > 0 && files.every((file) => videoMetadata[fileKey(file)]?.durationSeconds))
      setDraft((current) => ({ ...current, duration: formatDuration(total) }));
    else if (files.some((file) => videoMetadata[fileKey(file)] && !videoMetadata[fileKey(file)]?.loading))
      setDraft((current) => ({ ...current, duration: "" }));
  }, [files, videoMetadata]);

  const update = (key: keyof CourseDraft, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const addVideoFiles = (picked: File[]) => {
    const invalid = picked.find(
      (file) =>
        !VIDEO_TYPES.has(file.type) || !/\.(mp4|mov|avi)$/i.test(file.name),
    );
    if (invalid)
      return toast.error(`${invalid.name}: choose an MP4, MOV, or AVI file.`);
    if (picked.some((file) => file.size > 5 * 1024 * 1024 * 1024))
      return toast.error("Each video must be 5 GB or smaller.");
    const additions = picked.filter(
      (file) => !files.some((existing) => fileKey(existing) === fileKey(file)),
    );
    setFiles((current) => [...current, ...additions]);
    setLessonTitles((current) => ({ ...current, ...Object.fromEntries(additions.map((file) => [fileKey(file), file.name.replace(/\.[^.]+$/, "").slice(0, 180)])) }));
    setLessonOrders((current) => ({ ...current, ...Object.fromEntries(additions.map((file, index) => [fileKey(file), files.length + index + 1])) }));
    for (const file of additions) {
      const key = fileKey(file);
      const playbackUrl = URL.createObjectURL(file);
      playbackUrls.current.add(playbackUrl);
      setVideoMetadata((current) => ({ ...current, [key]: { loading: true, playbackUrl } }));
      inspectVideo(file)
        .then((metadata) => {
          setVideoMetadata((current) => ({
            ...current,
            [key]: { loading: false, playbackUrl, ...metadata },
          }));
        })
        .catch((err) =>
          setVideoMetadata((current) => ({
            ...current,
            [key]: { loading: false, playbackUrl, error: err.message },
          })),
        );
    }
  };

  const selectFiles = (event: ChangeEvent<HTMLInputElement>) => {
    addVideoFiles(Array.from(event.target.files || []));
    event.target.value = "";
  };

  const dropVideoFiles = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setVideoDragActive(false);
    addVideoFiles(Array.from(event.dataTransfer.files || []));
  };

  const removeFile = (file: File) => {
    const metadata = videoMetadata[fileKey(file)];
    if (metadata?.previewUrl) URL.revokeObjectURL(metadata.previewUrl);
    if (metadata?.playbackUrl) {
      URL.revokeObjectURL(metadata.playbackUrl);
      playbackUrls.current.delete(metadata.playbackUrl);
    }
    if (previewLesson === fileKey(file)) setPreviewLesson("");
    setFiles((current) =>
      current.filter((item) => fileKey(item) !== fileKey(file)),
    );
    setLessonTitles((current) => { const next = { ...current }; delete next[fileKey(file)]; return next; });
    setLessonOrders((current) => { const next = { ...current }; delete next[fileKey(file)]; return next; });
    setVideoMetadata((current) => {
      const next = { ...current };
      delete next[fileKey(file)];
      return next;
    });
  };

  const selectMaterials = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files || []);
    event.target.value = "";
    if (picked.some(file => file.size > 25 * 1024 * 1024)) return toast.error("Each resource must be 25 MB or smaller.");
    const allowed = /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt|zip)$/i;
    const invalid = picked.find(file => !allowed.test(file.name));
    if (invalid) return toast.error(`${invalid.name}: choose PDF, Word, PowerPoint, Excel, TXT, or ZIP.`);
    setCourseMaterials(current => [...current, ...picked.filter(file => !current.some(existing => fileKey(existing) === fileKey(file)))]);
  };

  const uploadFile = async (
    activeCourseId: string,
    activeSectionId: string,
    file: File,
    index: number,
  ) => {
    const key = fileKey(file);
    const baseName =
      (lessonTitles[key]?.trim() || file.name.replace(/\.[^.]+$/, "")).slice(0, 180) || `Lesson ${index + 1}`;
    const lesson = await responseData(
      await fetch(
        `${API}/api/instructors/courses/sections/${activeSectionId}/lessons/`,
        {
          method: "POST",
          headers: instructorHeaders(true),
          body: JSON.stringify({ title: baseName, position: lessonOrders[key] || index + 1, is_preview: previewLesson === key }),
        },
      ),
    );
    const initiated = await responseData(
      await fetch(
        `${API}/api/instructors/courses/lessons/${lesson.lesson_id}/video/initiate/`,
        {
          method: "POST",
          headers: instructorHeaders(true),
        body: JSON.stringify({
          file_name: file.name,
          size_bytes: file.size,
          duration_seconds: videoMetadata[fileKey(file)]?.durationSeconds,
          media_metadata: {
            width: videoMetadata[fileKey(file)]?.width,
            height: videoMetadata[fileKey(file)]?.height,
          },
        }),
        },
      ),
    );
    try {
      const parts: { part_number: number; etag: string }[] = [];
      let uploadedBytes = 0;
      let lastLoaded = 0;
      let lastAt = performance.now();
      let smoothedSpeed = 0;
      for (
        let partNumber = 1;
        partNumber <= initiated.part_count;
        partNumber++
      ) {
        setProgress(
          `Uploading ${file.name}: part ${partNumber} of ${initiated.part_count}`,
        );
        const part = await responseData(
          await fetch(
            `${API}/api/instructors/courses/videos/${initiated.video_id}/parts/${partNumber}/url/`,
            { headers: instructorHeaders() },
          ),
        );
        const start = (partNumber - 1) * initiated.part_size;
        const chunk = file.slice(
          start,
          Math.min(start + initiated.part_size, file.size),
        );
        const etag = await putPart(part.url, chunk, (partLoaded) => {
          const now = performance.now();
          const elapsed = (now - lastAt) / 1000;
          const totalLoaded = uploadedBytes + partLoaded;
          if (elapsed > 0) {
            const sample = Math.max(0, totalLoaded - lastLoaded) / elapsed;
            smoothedSpeed = smoothedSpeed
              ? smoothedSpeed * 0.75 + sample * 0.25
              : sample;
            lastAt = now;
            lastLoaded = totalLoaded;
          }
          setTransfer({
            fileName: file.name,
            loaded: totalLoaded,
            total: file.size,
            speed: smoothedSpeed,
            eta:
              smoothedSpeed > 0 ? (file.size - totalLoaded) / smoothedSpeed : 0,
          });
        });
        parts.push({ part_number: partNumber, etag });
        uploadedBytes += chunk.size;
        lastLoaded = uploadedBytes;
      }
      setProgress(`Finalizing ${file.name}…`);
      await responseData(
        await fetch(
          `${API}/api/instructors/courses/videos/${initiated.video_id}/complete/`,
          {
            method: "POST",
            headers: instructorHeaders(true),
            body: JSON.stringify({ parts }),
          },
        ),
      );
      const thumbnail = videoMetadata[fileKey(file)]?.thumbnail;
      if (thumbnail) {
        const form = new FormData();
        form.append("thumbnail", thumbnail);
        await responseData(
          await fetch(
            `${API}/api/instructors/courses/videos/${initiated.video_id}/thumbnail/`,
            { method: "POST", headers: instructorHeaders(), body: form },
          ),
        );
      }
    } catch (err) {
      await fetch(
        `${API}/api/instructors/courses/videos/${initiated.video_id}/`,
        { method: "DELETE", headers: instructorHeaders() },
      ).catch(() => undefined);
      throw err;
    }
    setCompleted((current) => [...current, fileKey(file)]);
    setTransfer((current) =>
      current?.fileName === file.name
        ? { ...current, loaded: file.size, speed: current.speed, eta: 0 }
        : current,
    );
    setProgress(`Uploaded ${file.name}; moderation is queued.`);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (thumbnailChecking) return setError("Wait for the course thumbnail’s 16:9 check to finish.");
    if (files.some((file) => {
      const metadata = videoMetadata[fileKey(file)];
      return !metadata?.width || !metadata.height || !isYouTubeLandscape(metadata.width, metadata.height);
    })) return setError("Every lesson video must pass the landscape 16:9 aspect ratio check before upload.");
    if (!courseThumbnailUploaded && !courseThumbnail && !(files[0] && videoMetadata[fileKey(files[0])]?.thumbnail))
      return setError("Upload a landscape 16:9 course thumbnail. This video has no frame the browser can use as a cover.");
    if (!courseId && files.length === 0)
      return setError(
        "Add at least one video lesson before submitting the course.",
      );
    setBusy(true);
    try {
      let activeCourseId = courseId;
      let activeSectionId = sectionId;
      if (!activeCourseId) {
        setProgress("Saving course details…");
        const result = await responseData(
          await fetch(`${API}/api/instructors/courses/`, {
            method: "POST",
            headers: instructorHeaders(true),
            body: JSON.stringify({
              title: draft.title,
              description: draft.description,
              category: draft.category,
              level: draft.level,
              duration: draft.duration,
              price: draft.price,
              learning_outcomes: draft.learning
                .split("\n")
                .map((value) => value.trim())
                .filter(Boolean),
              prerequisites: draft.prerequisites,
              certificate_delivery: draft.certificate_delivery,
            }),
          }),
        );
        activeCourseId = result.course_id;
        setCourseId(activeCourseId);
      }
      if (!courseThumbnailUploaded) {
        const thumbnail =
          courseThumbnail ||
          (files[0] ? videoMetadata[fileKey(files[0])]?.thumbnail : undefined);
        if (!thumbnail)
          throw new Error(
            "No cover frame could be generated from the video. Upload a landscape 16:9 course thumbnail to continue.",
          );
        setProgress("Saving course thumbnail…");
        const form = new FormData();
        form.append("thumbnail", thumbnail);
        await responseData(
          await fetch(
            `${API}/api/instructors/courses/${activeCourseId}/thumbnail/`,
            { method: "POST", headers: instructorHeaders(), body: form },
          ),
        );
        setCourseThumbnailUploaded(true);
      }
      for (const material of courseMaterials.filter(file => !uploadedMaterials.includes(fileKey(file)))) {
        setProgress(`Uploading course resource ${material.name}…`);
        const form = new FormData(); form.append("file", material); form.append("title", material.name.replace(/\.[^.]+$/, ""));
        await responseData(await fetch(`${API}/api/instructors/courses/${activeCourseId}/materials/`, { method: "POST", headers: instructorHeaders(), body: form }));
        setUploadedMaterials(current => [...current, fileKey(material)]);
      }
      if (!activeSectionId) {
        setProgress("Creating course section…");
        const result = await responseData(
          await fetch(
            `${API}/api/instructors/courses/${activeCourseId}/sections/`,
            {
              method: "POST",
              headers: instructorHeaders(true),
              body: JSON.stringify({ title: "Course content", position: 1 }),
            },
          ),
        );
        activeSectionId = result.section_id;
        setSectionId(activeSectionId);
      }
      const remaining = files.filter(
        (file) => !completed.includes(fileKey(file)),
      ).sort((a, b) => (lessonOrders[fileKey(a)] || files.indexOf(a) + 1) - (lessonOrders[fileKey(b)] || files.indexOf(b) + 1));
      for (let index = 0; index < remaining.length; index++)
        await uploadFile(
          activeCourseId,
          activeSectionId,
          remaining[index],
          completed.length + index,
        );
      setProgress("Submitting course for moderation and admin review…");
      await responseData(
        await fetch(
          `${API}/api/instructors/courses/${activeCourseId}/submit/`,
          { method: "POST", headers: instructorHeaders() },
        ),
      );
      toast.success(
        "Course submitted. It will be published after moderation and admin approval.",
      );
      if (onComplete) onComplete();
      else router.push("/instructors/dashboard/programs");
    } catch (err: any) {
      const message = err.message || "Could not submit course.";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
      setProgress("");
      setTransfer(null);
    }
  };

  const input = (
    label: string,
    key: keyof CourseDraft,
    type = "text",
    required = true,
  ) => (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      <input
        required={required}
        type={type}
        value={draft[key]}
        onChange={(event) => update(key, event.target.value)}
        className="mt-1 w-full rounded-none border border-gray-300 px-3 py-2 font-normal"
      />
    </label>
  );
  const goNext = () => {
    setError("");
    if (step === 0) {
      if (files.length === 0)
        return setError("Add at least one video before continuing.");
      if (
        files.some(
          (file) =>
            videoMetadata[fileKey(file)]?.loading ||
            !videoMetadata[fileKey(file)]?.width ||
            !videoMetadata[fileKey(file)]?.height,
        )
      )
        return setError(
          "Wait for every video’s dimensions and 16:9 check to finish.",
        );
      if (files.some((file) => videoMetadata[fileKey(file)]?.error))
        return setError(
          "Remove or replace videos that failed metadata or 16:9 validation.",
        );
      if (files.some((file) => {
        const metadata = videoMetadata[fileKey(file)];
        return !metadata?.width || !metadata.height || !isYouTubeLandscape(metadata.width, metadata.height);
      })) return setError("Every lesson video must be landscape 16:9 before continuing.");
      setStep(1);
      return;
    }
    if (step === 1 && thumbnailChecking)
      return setError("Wait for the course thumbnail’s 16:9 check to finish.");
    if (formRef.current?.reportValidity()) setStep(2);
  };
  const reviewRows = [
    ["Title", draft.title],
    ["Category", draft.category],
    ["Level", draft.level],
    ["Duration", draft.duration],
    [
      "Price",
      Number(draft.price) === 0
        ? "Free"
        : `₹${Number(draft.price).toLocaleString("en-IN")}`,
    ],
    [
      "Learning outcomes",
      draft.learning.split("\n").filter(Boolean).length.toString(),
    ],
    ["Videos", `${files.length} lesson${files.length === 1 ? "" : "s"}`],
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {!onClose && (
            <Link
              href="/instructors/dashboard/programs"
              className="rounded-none border px-3 py-2 text-sm text-gray-600"
            >
              ← Courses
            </Link>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Create a course
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Upload lesson videos first, then add your course details.
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close course uploader"
            className="rounded-none p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </header>

      <ol className="grid grid-cols-3 gap-2" aria-label="Course upload steps">
        {["Upload videos", "Course details", "Review & submit"].map(
          (label, index) => (
            <li key={label}>
              <button
                type="button"
                disabled={busy || index >= step}
                onClick={() => setStep(index)}
                aria-current={step === index ? "step" : undefined}
                className={`w-full border px-3 py-3 text-left transition-colors ${step === index ? "border-blue-600 bg-blue-50 text-blue-800" : index < step ? "border-emerald-500 bg-emerald-50 text-gray-700" : "border-gray-200 bg-white text-gray-500"}`}
              >
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                  {index < step ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    `Step ${index + 1}`
                  )}
                </span>
                <span className="mt-1 block text-sm font-medium">{label}</span>
              </button>
            </li>
          ),
        )}
      </ol>

      <form ref={formRef} onSubmit={submit} className="space-y-5">
        {step === 0 && (
          <section className="space-y-4 rounded-none border bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">Course media</p>
                <h2 className="mt-1 text-lg font-bold text-slate-950">Build your lesson library</h2>
                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">Upload landscape 16:9 lesson videos. Portrait and Shorts-style clips are blocked before upload.</p>
              </div>
              <span className="border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-800">16:9 REQUIRED</span>
            </div>
            <label onDragOver={(event) => { event.preventDefault(); setVideoDragActive(true); }} onDragLeave={() => setVideoDragActive(false)} onDrop={dropVideoFiles} className={`group flex cursor-pointer flex-col items-center border-2 border-dashed px-5 py-8 text-center transition sm:py-10 ${videoDragActive ? "border-indigo-600 bg-indigo-50" : "border-slate-300 bg-slate-50 hover:border-indigo-500 hover:bg-indigo-50/50"}`}>
              <span className="grid h-12 w-12 place-items-center border border-indigo-100 bg-white text-indigo-700 shadow-sm"><ArrowRight className="h-5 w-5 rotate-90" /></span>
              <span className="mt-4 text-sm font-bold text-slate-900">Drop lesson videos here or browse files</span>
              <span className="mt-1 text-xs text-slate-500">H.264 MP4 or MOV recommended · landscape 16:9 · up to 5 GB per file</span>
              <input
                ref={videoInputRef}
                type="file"
                multiple
                accept=".mp4,.mov,.avi,video/mp4,video/quicktime,video/x-msvideo"
                onChange={selectFiles}
                className="sr-only"
              />
            </label>
            {files.length > 0 ? (
              <ul className="divide-y rounded-none border">
                {files.map((file) => {
                  const metadata = videoMetadata[fileKey(file)];
                  const key = fileKey(file);
                  return (
                    <li
                      key={fileKey(file)}
                      className="flex items-start gap-4 p-4 text-sm sm:p-5"
                    >
                      <div className="aspect-video w-32 shrink-0 overflow-hidden border border-slate-200 bg-slate-950 sm:w-40">
                        {metadata?.playbackUrl ? (
                          <video
                            src={metadata.playbackUrl}
                            controls
                            playsInline
                            preload="metadata"
                            aria-label={`Preview lesson video ${file.name}`}
                            onError={() => setVideoMetadata((current) => ({
                              ...current,
                              [key]: { ...(current[key] || { loading: false }), previewUnsupported: true },
                            }))}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-xs font-medium text-white/70">
                            {metadata?.loading ? "Analyzing video…" : metadata?.error ? "Preview unavailable" : "16:9 video"}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <label className="block text-xs font-medium text-gray-600">Lesson title
                          <input aria-label={`Title for ${file.name}`} maxLength={180} value={lessonTitles[key] || ""} onChange={(event) => setLessonTitles(current => ({ ...current, [key]: event.target.value }))} className="mt-1 w-full border border-gray-300 px-2 py-1 text-sm text-gray-900" />
                        </label>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <label className="text-xs text-gray-600">Play order
                            <select value={lessonOrders[key] || files.indexOf(file) + 1} onChange={(event) => setLessonOrders(current => ({ ...current, [key]: Number(event.target.value) }))} className="ml-2 border border-gray-300 px-2 py-1 text-gray-900">
                              {files.map((_, orderIndex) => <option key={orderIndex} value={orderIndex + 1}>{orderIndex + 1}</option>)}
                            </select>
                          </label>
                          <label className="inline-flex items-center gap-2 text-xs text-gray-600"><input type="radio" name="previewLesson" checked={previewLesson === key} onChange={() => setPreviewLesson(key)} /> Free preview</label>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {completed.includes(key)
                            ? "Uploaded"
                            : `${formatBytes(file.size)} · Ready`}
                          {metadata?.durationSeconds
                            ? ` · ${formatDuration(metadata.durationSeconds)}`
                            : metadata && !metadata.loading && !metadata.error ? " · Duration unavailable" : ""}
                          {metadata?.width && metadata?.height ? ` · ${metadata.width} × ${metadata.height} · 16:9` : ""}
                        </p>
                        {metadata && !metadata.loading && !metadata.error && metadata.width && metadata.height && <span className="mt-2 inline-flex border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800">16:9 verified</span>}
                        {metadata?.previewUnsupported && <p className="mt-1 text-xs text-amber-700">This browser can’t play this codec inline. The file dimensions were checked; use H.264 MP4 for in-browser preview.</p>}
                        {metadata?.error && (
                          <p className="text-xs text-red-600">
                            {metadata.error}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => removeFile(file)}
                        className="shrink-0 text-xs font-medium text-red-600 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="rounded-none border-2 border-dashed p-8 text-center text-sm text-gray-500">
                Add at least one video to continue.
              </div>
            )}
            <p className="border-l-2 border-indigo-500 bg-indigo-50/60 px-4 py-3 text-xs leading-5 text-slate-600">
              Add multiple lessons. Each video is checked for its actual dimensions and will upload privately, one at a time, after you submit.
            </p>
          </section>
        )}

        {step === 1 && (
          <section className="grid gap-4 rounded-none border bg-white p-5 sm:grid-cols-2">
            <h2 className="font-semibold sm:col-span-2">Course information</h2>
            {input("Course title", "title")}
            <label className="block text-sm font-medium text-gray-700">
              Category
              <select
                required
                value={draft.category}
                onChange={(event) => update("category", event.target.value)}
                className="mt-1 w-full rounded-none border border-gray-300 px-3 py-2 font-normal"
              >
                <option value="">Choose a category</option>
                {COURSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Level
              <select
                required
                value={draft.level}
                onChange={(event) => update("level", event.target.value)}
                className="mt-1 w-full rounded-none border border-gray-300 px-3 py-2 font-normal"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Course duration
              <input
                readOnly
                value={draft.duration}
                placeholder={files.some((file) => videoMetadata[fileKey(file)] && !videoMetadata[fileKey(file)]?.durationSeconds) ? "Duration unavailable for one or more videos" : "Calculated from uploaded videos"}
                className="mt-1 w-full rounded-none border border-gray-300 bg-gray-50 px-3 py-2 font-normal text-gray-600"
              />
              <span className="mt-1 block text-xs font-normal text-gray-500">
                Automatically totaled from all lesson videos.
              </span>
            </label>
            <label className="block text-sm font-semibold text-gray-800 sm:col-span-2">
              Course thumbnail <span className="text-xs font-bold uppercase tracking-wide text-indigo-700">16:9</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  event.target.value = "";
                  setThumbnailChecking(true);
                  if (file.size > 5 * 1024 * 1024)
                    { setThumbnailChecking(false); return toast.error("Thumbnail must be 5 MB or smaller."); }
                  try {
                    await inspectImage(file);
                  } catch (cause) {
                    setThumbnailChecking(false);
                    return toast.error(cause instanceof Error ? cause.message : "Choose a landscape 16:9 thumbnail.");
                  }
                  setCourseThumbnail(file);
                  setCourseThumbnailUploaded(false);
                  setThumbnailChecking(false);
                }}
                className="mt-3 block w-full border border-slate-200 bg-slate-50 p-3 text-sm font-normal file:mr-4 file:border-0 file:bg-indigo-700 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-indigo-800"
              />
              <span className="mt-2 block text-xs font-normal leading-5 text-gray-500">
                {thumbnailChecking ? "Checking image dimensions…" : courseThumbnail ? "16:9 thumbnail validated." : "Use a 16:9 image (1280 × 720 recommended), or leave this blank to use the first lesson’s validated video frame."}
              </span>
              {(courseThumbnailPreview ||
                (files[0] && videoMetadata[fileKey(files[0])]?.previewUrl)) && (
                <img
                  src={
                    courseThumbnailPreview ||
                    (files[0]
                      ? videoMetadata[fileKey(files[0])]?.previewUrl
                      : "")
                  }
                  alt="Course thumbnail preview"
                  className="mt-3 aspect-video w-full border border-slate-200 bg-slate-100 object-cover"
                />
              )}
            </label>
            <label className="block text-sm font-medium text-gray-700 sm:col-span-2">Course materials (optional)<input type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip" onChange={selectMaterials} className="mt-1 block w-full text-sm font-normal"/><span className="mt-1 block text-xs font-normal text-gray-500">PDF, Office documents, TXT, or ZIP; up to 25 MB each. Resources stay private until a learner enrolls.</span>{courseMaterials.length > 0 && <ul className="mt-2 divide-y border">{courseMaterials.map(file => <li key={fileKey(file)} className="flex items-center justify-between gap-3 px-3 py-2 text-xs"><span className="truncate">{file.name}</span><span className="shrink-0 text-gray-500">{uploadedMaterials.includes(fileKey(file)) ? "Uploaded" : formatBytes(file.size)}</span></li>)}</ul>}</label>
            <label className="block text-sm font-medium text-gray-700">
              Course price (INR)
              <select
                required
                value={draft.price}
                onChange={(event) => update("price", event.target.value)}
                className="mt-1 w-full rounded-none border border-gray-300 px-3 py-2 font-normal"
              >
                {COURSE_PRICES.map((price) => (
                  <option key={price} value={price}>
                    {price === 0 ? "Free" : `₹${price.toLocaleString("en-IN")}`}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs font-normal text-gray-500">
                Choose a preset price from Free to ₹9,999.
              </span>
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Certificate delivery
              <select value={draft.certificate_delivery} onChange={(event) => update("certificate_delivery", event.target.value)} className="mt-1 w-full rounded-none border border-gray-300 px-3 py-2 font-normal">
                <option value="automatic">Automatically email after course completion</option>
                <option value="manual">Instructor sends after reviewing completion</option>
              </select>
              <span className="mt-1 block text-xs font-normal text-gray-500">Choose when the learner receives the course certificate.</span>
            </label>
            <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
              Description
              <textarea
                required
                minLength={30}
                rows={4}
                value={draft.description}
                onChange={(event) => update("description", event.target.value)}
                className="mt-1 w-full rounded-none border border-gray-300 px-3 py-2 font-normal"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
              Learning outcomes (one per line)
              <textarea
                required
                rows={3}
                value={draft.learning}
                onChange={(event) => update("learning", event.target.value)}
                className="mt-1 w-full rounded-none border border-gray-300 px-3 py-2 font-normal"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
              Prerequisites
              <textarea
                rows={2}
                value={draft.prerequisites}
                onChange={(event) =>
                  update("prerequisites", event.target.value)
                }
                className="mt-1 w-full rounded-none border border-gray-300 px-3 py-2 font-normal"
              />
            </label>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4 rounded-none border bg-white p-5">
            <div>
              <h2 className="font-semibold text-gray-900">
                Review your course
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Confirm the details and video lessons before submitting for
                review.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {reviewRows.map(([label, value]) => (
                <div key={label} className="rounded-none bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    {label}
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {value || "—"}
                  </p>
                </div>
              ))}
            </div>
            <ul className="divide-y rounded-none border">
              {files.map((file) => (
                <li
                  key={fileKey(file)}
                  className="flex justify-between gap-3 px-3 py-2 text-sm"
                >
                  <span className="truncate">{file.name}</span>
                  <span className="shrink-0 text-gray-500">
                    {completed.includes(fileKey(file))
                      ? "Uploaded"
                      : formatBytes(file.size)}
                  </span>
                </li>
              ))}
            </ul>
            {transfer && (
              <div className="rounded-none border p-4" aria-live="polite">
                <div className="mb-2 flex justify-between gap-3 text-sm">
                  <span className="truncate font-semibold text-gray-800">
                    Uploading {transfer.fileName}
                  </span>
                  <span className="font-semibold tabular-nums text-blue-700">
                    {Math.round((transfer.loaded / transfer.total) * 100)}%
                  </span>
                </div>
                <div
                  className="h-2.5 overflow-hidden rounded-none bg-gray-200"
                  role="progressbar"
                  aria-label={`Upload progress for ${transfer.fileName}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(
                    (transfer.loaded / transfer.total) * 100,
                  )}
                >
                  <div
                    className="h-full rounded-none bg-blue-600 transition-[width] duration-150"
                    style={{
                      width: `${Math.min(100, (transfer.loaded / transfer.total) * 100)}%`,
                    }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-600">
                  <span>
                    {transfer.speed > 0
                      ? `${formatBytes(transfer.speed)}/s`
                      : "Calculating speed…"}
                  </span>
                  <span>
                    {transfer.speed > 0
                      ? `${formatEta(transfer.eta)} remaining`
                      : "Calculating time remaining…"}
                  </span>
                </div>
              </div>
            )}
          </section>
        )}

        {error && (
          <p
            role="alert"
            className="whitespace-pre-wrap rounded-none border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {progress && (
          <p
            aria-live="polite"
            className="rounded-none bg-blue-50 p-3 text-sm text-blue-800"
          >
            {progress}
          </p>
        )}
        <div className="flex justify-between gap-3 border-t pt-4">
          {step > 0 ? (
            <button
              disabled={busy}
              type="button"
              onClick={() => {
                setError("");
                setStep((current) => current - 1);
              }}
              className="inline-flex items-center gap-2 rounded-none border px-4 py-2.5 text-sm font-semibold text-gray-700 disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <span />
          )}
          {step < 2 ? (
            <button
              disabled={busy || (step === 0 && files.length === 0)}
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-2 rounded-none bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {step === 0 ? "Continue to details" : "Review course"}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              disabled={busy}
              type="submit"
              className="rounded-none bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {busy
                ? "Uploading…"
                : courseId
                  ? "Continue and submit"
                  : "Upload and submit course"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}



