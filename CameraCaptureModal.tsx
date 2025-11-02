import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const CameraCaptureModal: React.FC<{
    onCapture: (dataUrl: string) => void;
    onClose: () => void;
}> = ({ onCapture, onClose }) => {
    const { t } = useTranslation();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let stream: MediaStream | null = null;
        const enableCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing camera: ", err);
                alert(t('cameraError'));
                onClose();
            }
        };
        enableCamera();

        return () => {
            stream?.getTracks().forEach(track => track.stop());
        };
    }, [t, onClose]);
    
    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                const { videoWidth, videoHeight } = videoRef.current;
                canvasRef.current.width = videoWidth;
                canvasRef.current.height = videoHeight;
                context.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg');
                onCapture(dataUrl);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-[--color-surface] rounded-2xl shadow-2xl p-6 w-full max-w-lg text-center" onClick={e => e.stopPropagation()}>
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg mb-4"></video>
                <canvas ref={canvasRef} className="hidden"></canvas>
                <button onClick={handleCapture} className="w-full bg-[--color-primary] hover:bg-[--color-primary-hover] text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors">
                    {t('capturePhoto')}
                </button>
            </div>
        </div>
    );
}

export default CameraCaptureModal;
