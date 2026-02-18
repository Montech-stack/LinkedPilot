import React, { useState, useRef } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface AudioRecorderProps {
    onTranscription: (text: string) => void;
}

export default function AudioRecorder({ onTranscription }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
                await handleTranscribe(audioBlob);
                stream.getTracks().forEach(track => track.stop()); // Stop mic
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error(err);
            toast.error("Microphone access denied");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleTranscribe = async (audioBlob: Blob) => {
        setIsProcessing(true);
        const toastId = toast.loading("Transcribing...");

        try {
            const formData = new FormData();
            formData.append("file", audioBlob, "recording.webm");

            const res = await fetch("/api/ai/transcribe", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Transcription failed");

            const data = await res.json();
            onTranscription(data.text);
            toast.success("Transcribed!", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("Failed to transcribe", { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            {isProcessing ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-xs text-muted-foreground animate-pulse">
                    <Loader2 size={14} className="animate-spin" />
                    Processing...
                </div>
            ) : isRecording ? (
                <button
                    onClick={stopRecording}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-full text-xs font-medium transition-colors animate-pulse border border-red-500/20"
                >
                    <Square size={14} fill="currentColor" />
                    Stop Recording
                </button>
            ) : (
                <button
                    onClick={startRecording}
                    className="flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-full text-xs font-medium transition-colors border border-border"
                >
                    <Mic size={14} />
                    Voice Note
                </button>
            )}
        </div>
    );
}
