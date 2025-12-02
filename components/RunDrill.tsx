import React, { useState, useRef, useEffect } from 'react';
import { Drill, Player, DrillResult } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RunDrillProps {
  player: Player;
  drills: Drill[];
  onUpdatePlayer: (updatedPlayer: Player) => void;
}

const RunDrill: React.FC<RunDrillProps> = ({ player, drills, onUpdatePlayer }) => {
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<number | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Show all drills that have a unit defined (implying they are measurable/runnable in this mode)
  // or specifically the Vertical drill.
  const availableDrills = drills.filter(d => d.unit || d.name === 'Vertical');

  useEffect(() => {
    return () => {
      // Cleanup stream on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleStartDrill = async (drill: Drill) => {
    setSelectedDrill(drill);
    setError(null);
    setAnalysisResult(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please ensure you have granted permission.");
    }
  };

  const handleStopRecording = () => {
    if (stream) {
        // Don't fully stop the stream yet if we want to show a replay or freeze frame,
        // but for this MVP we might just stop it or keep it running in background.
        // Let's stop it to indicate "recording finished".
       stream.getTracks().forEach(track => track.stop());
       setStream(null);
    }
    setIsRecording(false);

    // Simulate analysis
    // Generate a random jump height between 18 and 30 inches for "Vertical"
    const randomResult = (Math.random() * (30 - 18) + 18).toFixed(1);
    setAnalysisResult(parseFloat(randomResult));
  };

  const handleSaveResult = () => {
    if (selectedDrill && analysisResult !== null) {
      const newResult: DrillResult = {
        id: Date.now().toString(),
        drillId: selectedDrill.id,
        date: new Date().toISOString(),
        value: analysisResult,
        unit: selectedDrill.unit || 'units'
      };

      const updatedPlayer = {
        ...player,
        drillHistory: [...(player.drillHistory || []), newResult]
      };

      onUpdatePlayer(updatedPlayer);
      setSelectedDrill(null); // Go back to list or reset
      setAnalysisResult(null);
    }
  };

  const handleCancel = () => {
      if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
      }
      setSelectedDrill(null);
      setAnalysisResult(null);
      setIsRecording(false);
  }

  // Calculate history for chart
  const getHistoryData = (drillId: number) => {
      if (!player.drillHistory) return [];
      return player.drillHistory
        .filter(h => h.drillId === drillId)
        .map(h => ({
            date: new Date(h.date).toLocaleDateString(),
            value: h.value
        }));
  };

  if (selectedDrill) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">{selectedDrill.name}</h2>
            <button onClick={handleCancel} className="text-slate-400 hover:text-white">Back to Drills</button>
        </div>

        {error ? (
             <div className="bg-red-500/20 text-red-400 p-4 rounded mb-4">
                {error}
             </div>
        ) : !analysisResult ? (
            <div className="space-y-6">
                <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                    {stream ? (
                         <video
                            ref={element => {
                                if (element) element.srcObject = stream;
                                videoRef.current = element;
                            }}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                         />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                            Camera Preview
                        </div>
                    )}

                    {isRecording && (
                        <div className="absolute top-4 right-4 animate-pulse">
                            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        </div>
                    )}
                </div>

                <div className="flex justify-center space-x-4">
                    {!stream && !isRecording && (
                        <button
                            onClick={() => handleStartDrill(selectedDrill)} // Re-init camera
                            className="bg-sky-500 hover:bg-sky-600 text-white px-8 py-3 rounded-full font-bold transition-colors"
                        >
                            Start Camera
                        </button>
                    )}

                    {stream && !isRecording && (
                         <button
                            onClick={() => setIsRecording(true)}
                            className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-bold transition-colors"
                         >
                             Record
                         </button>
                    )}

                    {isRecording && (
                        <button
                            onClick={handleStopRecording}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-3 rounded-full font-bold transition-colors border border-slate-500"
                        >
                            Stop & Analyze
                        </button>
                    )}
                </div>
                <p className="text-center text-slate-400 text-sm">
                    {isRecording ? "Perform your drill now. Press Stop when finished." : "Position yourself in the camera view."}
                </p>
            </div>
        ) : (
            <div className="space-y-6 text-center py-8">
                <h3 className="text-xl text-slate-300">Analysis Complete</h3>
                <div className="text-6xl font-bold text-sky-400">
                    {analysisResult} <span className="text-2xl text-slate-500">{selectedDrill.unit}</span>
                </div>
                <p className="text-slate-400">Great job! This has been recorded.</p>

                <div className="flex justify-center space-x-4">
                    <button
                        onClick={() => {
                            setAnalysisResult(null);
                            handleStartDrill(selectedDrill);
                        }}
                        className="px-6 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                        Retry
                    </button>
                    <button
                        onClick={handleSaveResult}
                        className="bg-sky-500 hover:bg-sky-600 text-white px-8 py-2 rounded-lg font-bold transition-colors"
                    >
                        Save Result
                    </button>
                </div>
            </div>
        )}

        {/* History Chart for this drill */}
        <div className="mt-12 pt-8 border-t border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Your Progression</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getHistoryData(selectedDrill.id)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="date" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                        />
                        <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={2} dot={{ fill: '#38bdf8' }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {availableDrills.map(drill => (
        <div key={drill.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-sky-500 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className="text-xl font-bold text-white mb-2">{drill.name}</h3>
                <span className="inline-block px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-md">
                    {drill.skill}
                </span>
            </div>
          </div>
          <p className="text-slate-400 mb-6 text-sm">{drill.description}</p>
          <button
            onClick={() => handleStartDrill(drill)}
            className="w-full py-2 bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white rounded-lg transition-all font-medium"
          >
            Start Drill
          </button>

          {/* Mini trend line or last result could go here */}
          <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between text-sm">
             <span className="text-slate-500">Last Attempt:</span>
             <span className="text-slate-300">
                 {player.drillHistory?.filter(h => h.drillId === drill.id).slice(-1)[0]?.value ?? '-'} {drill.unit}
             </span>
          </div>
        </div>
      ))}

      {/* Fallback if no specific drill matches */}
      {availableDrills.length === 0 && (
          <div className="col-span-full text-center text-slate-500 py-12">
              No drills available for this category yet.
          </div>
      )}
    </div>
  );
};

export default RunDrill;
