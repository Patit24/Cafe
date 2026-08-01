'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Webcam from 'react-webcam';
import { Camera, Save, ArrowLeft, Trash2, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { API_BASE_URL, fastFetch } from '@/lib/api';
import { loadFaceApiModels, generateNeuralFaceEmbedding } from '@/utils/faceEmbedding';

export default function FacialRegistrationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const webcamRef = useRef<Webcam>(null);

  const [employee, setEmployee] = useState<any>(null);
  const [faces, setFaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(true);

  const [activeAngle, setActiveAngle] = useState<'front' | 'left' | 'right'>('front');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadFaceApiModels().then((ok) => {
      setModelsReady(ok);
      setModelsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (id) fetchEmployeeAndFaces();
  }, [id]);

  const fetchEmployeeAndFaces = async () => {
    if (!id) return;
    try {
      const [empRes, faceRes] = await Promise.all([
        fastFetch(`${API_BASE_URL}/employees/${id}`),
        fastFetch(`${API_BASE_URL}/employees/${id}/faces`)
      ]);
      const empData = await empRes.json();
      const faceData = await faceRes.json();
      setEmployee(empData);
      setFaces(Array.isArray(faceData) ? faceData : []);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
    }
  }, [webcamRef]);

  const saveFace = async () => {
    if (!capturedImage || !id) return;
    setIsUploading(true);

    try {
      const downloadURL = capturedImage;

      // Generate REAL 128D neural face descriptor using face-api.js
      let faceEmbedding: number[] | null = null;
      if (modelsReady) {
        faceEmbedding = await generateNeuralFaceEmbedding(capturedImage);
      }

      if (!faceEmbedding) {
        alert('⚠️ No face detected in this photo. Please retake with your face clearly visible and well-lit.');
        setIsUploading(false);
        return;
      }

      // Save to Database with real 128D embedding
      await fetch(`${API_BASE_URL}/employees/${id}/faces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: downloadURL,
          angle: activeAngle,
          faceEmbedding: faceEmbedding
        })
      });

      setCapturedImage(null);
      await fetchEmployeeAndFaces();
    } catch (error) {
      console.error('Error uploading face:', error);
      alert('Failed to save face profile.');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteFace = async (faceId: string) => {
    if (!confirm('Are you sure you want to delete this face profile?')) return;
    try {
      await fetch(`${API_BASE_URL}/employees/faces/${faceId}`, {
        method: 'DELETE'
      });
      fetchEmployeeAndFaces();
    } catch (error) {
      console.error('Error deleting face:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600 font-medium">
        <Loader2 className="animate-spin text-purple-600 mr-2" size={24} />
        Loading face profiles...
      </div>
    );
  }

  if (modelsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-3">
        <Loader2 className="animate-spin text-purple-600" size={32} />
        <p className="text-gray-700 font-semibold">Loading AI Face Recognition Models...</p>
        <p className="text-gray-400 text-sm">Downloading neural network weights (first time ~5MB)</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => router.push('/employees')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors font-medium text-sm"
        >
          <ArrowLeft size={16} /> Back to Employees
        </button>

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Facial Registration</h1>
          <p className="text-sm text-gray-500 mt-1">
            Register face profiles for <span className="font-semibold text-gray-900">{employee?.name || 'Employee'}</span> to enable biometric attendance.
          </p>
          {modelsReady && (
            <div className="flex items-center gap-2 mt-2 text-green-600 text-xs font-medium">
              <CheckCircle size={14} />
              Neural face recognition models ready (128D descriptors)
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Camera Section */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Capture Image</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setActiveAngle('front'); setCapturedImage(null); }}
                  className={`px-3 py-1 text-xs font-semibold rounded-full border ${activeAngle === 'front' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-white text-gray-600 border-gray-200'}`}
                >Front</button>
                <button 
                  onClick={() => { setActiveAngle('left'); setCapturedImage(null); }}
                  className={`px-3 py-1 text-xs font-semibold rounded-full border ${activeAngle === 'left' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-white text-gray-600 border-gray-200'}`}
                >Left</button>
                <button 
                  onClick={() => { setActiveAngle('right'); setCapturedImage(null); }}
                  className={`px-3 py-1 text-xs font-semibold rounded-full border ${activeAngle === 'right' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-white text-gray-600 border-gray-200'}`}
                >Right</button>
              </div>
            </div>

            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-[4/3] flex items-center justify-center mb-6">
              {!isCapturing && !capturedImage ? (
                <div className="text-center">
                  <Camera size={48} className="mx-auto text-gray-500 mb-2" />
                  <button 
                    onClick={() => setIsCapturing(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700"
                  >
                    Turn on Camera
                  </button>
                </div>
              ) : capturedImage ? (
                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
              ) : (
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "user" }}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {isCapturing && !capturedImage && (
              <button 
                onClick={capture}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex justify-center items-center gap-2"
              >
                <Camera size={18} /> Take Photo
              </button>
            )}

            {capturedImage && (
              <div className="flex gap-4">
                <button 
                  onClick={() => setCapturedImage(null)}
                  disabled={isUploading}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Retake
                </button>
                <button 
                  onClick={saveFace}
                  disabled={isUploading}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex justify-center items-center gap-2"
                >
                  {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {isUploading ? 'Saving...' : 'Save Face Profile'}
                </button>
              </div>
            )}
          </div>

          {/* Registered Faces Section */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Registered Profiles ({faces.length})</h2>
            {faces.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <AlertCircle size={32} className="mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-500 font-medium">No face profiles registered yet.</p>
                <p className="text-xs text-gray-400 mt-1">Capture photos from multiple angles to improve matching accuracy.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {faces.map((face) => (
                  <div key={face.id} className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    <img src={face.imageUrl} alt={face.angle} className="w-full aspect-square object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                      <span className="text-white text-xs font-bold uppercase tracking-wider bg-black/40 self-start px-2 py-1 rounded">
                        {face.angle}
                      </span>
                      <button 
                        onClick={() => deleteFace(face.id)}
                        className="self-end p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
