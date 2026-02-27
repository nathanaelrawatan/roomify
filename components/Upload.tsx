import React, { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router";
import { CheckCircle2, ImageIcon, UploadIcon } from "lucide-react";
import {PROGRESS_INCREMENT, PROGRESS_INTERVAL_MS, REDIRECT_DELAY_MS} from "../lib/constants";

type UploadProps = {
    onComplete?: (base64DataUrl: string) => void;
};

const Upload = ({ onComplete }: UploadProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);

    const { isSignedIn } = useOutletContext<AuthContext>();

    const intervalRef = useRef<number | null>(null);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
            if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
        };
    }, []);

    const processFile = (nextFile: File) => {
        if (!isSignedIn) return;

        setFile(nextFile);
        setProgress(0);

        if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
        if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);

        const reader = new FileReader();

        reader.onerror = () => {
        setFile(null);
        setProgress(0);
        };

        reader.onload = () => {
            const base64DataUrl = String(reader.result || "");

            intervalRef.current = window.setInterval(() => {
                setProgress((prev) => {
                    const next = Math.min(100, prev + PROGRESS_INCREMENT);

                    if (next === 100 && intervalRef.current !== null) {
                        window.clearInterval(intervalRef.current);
                        intervalRef.current = null;

                        timeoutRef.current = window.setTimeout(() => {
                            onComplete?.(base64DataUrl);
                        }, REDIRECT_DELAY_MS);
                    }

                    return next;
                });
            }, PROGRESS_INTERVAL_MS);
        };

        reader.readAsDataURL(nextFile);
    };

    const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        if (!isSignedIn) return;

        const selected = e.target.files?.[0];
        if (!selected) return;

        processFile(selected);

        // allow selecting the same file again to re-trigger onChange
        e.target.value = "";
    };

    const onDragEnter: React.DragEventHandler<HTMLDivElement> = (e) => {
        if (!isSignedIn) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
        if (!isSignedIn) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const onDragLeave: React.DragEventHandler<HTMLDivElement> = (e) => {
        if (!isSignedIn) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
        if (!isSignedIn) return;
        e.preventDefault();
        e.stopPropagation();

        setIsDragging(false);

        const dropped = e.dataTransfer.files?.[0];
        if (!dropped) return;

        const allowedTypes = ["image/jpeg", "image/png"];

        if (dropped && allowedTypes.includes(dropped.type)) {
            processFile(dropped);
        }
    };

    return (
        <div className="upload">
            {!file ? (
                <div
                    className={`dropzone ${isSignedIn && isDragging ? "is-dragging" : ""}`}
                    onDragEnter={onDragEnter}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                >
                    <input
                        type="file"
                        className="drop-input"
                        accept=".jpg,.jpeg,.png"
                        disabled={!isSignedIn}
                        onChange={onChange}
                    />

                    <div className="drop-content">
                        <div className="drop-icon">
                            <UploadIcon size={20} />
                        </div>
                        <p>
                            {isSignedIn
                                ? "Click to upload or just drag and drop"
                                : "Sign in or sign up with Puter to upload"}
                        </p>

                        <p className="help">Maximum file size 50 MB</p>
                    </div>
                </div>
            ) : (
                <div className="upload-status">
                    <div className="status-content">
                        <div className="status-icon">
                            {progress === 100 ? <CheckCircle2 size={20} /> : <ImageIcon className="image" />}
                        </div>

                        <h3>{file.name}</h3>

                        <div className="progress">
                            <div className="bar" style={{ width: `${progress}%` }} />

                            <p className="status-text">
                                {progress < 100 ? "Redirecting ..." : "Analyzing floor plan ..."}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Upload;