import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Mic, Upload, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const UploadList = () => {
    const navigate = useNavigate();
    const [isUploading, setIsUploading] = useState(false);
    const [step, setStep] = useState(1);

    const handleUpload = () => {
        setIsUploading(true);
        setTimeout(() => {
            setIsUploading(false);
            setStep(2);
            toast.success("List uploaded successfully!");
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-500 font-bold mb-8 hover:text-indigo-600 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span>Back to Home</span>
                </button>

                {step === 1 ? (
                    <div className="bg-white rounded-[2.5rem] shadow-xl border border-indigo-50 p-8 md:p-12 text-center space-y-8 animate-in fade-in zoom-in duration-500">
                        <div className="space-y-4">
                            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Upload Your List</h1>
                            <p className="text-gray-500 font-medium text-lg">Choose how you want to share your grocery needs</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button className="flex flex-col items-center gap-4 p-8 bg-indigo-50 rounded-3xl border border-indigo-100 hover:border-indigo-300 transition-all group">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                    <Camera size={32} className="text-indigo-600" />
                                </div>
                                <span className="font-bold text-gray-900">Take Photo</span>
                            </button>

                            <button className="flex flex-col items-center gap-4 p-8 bg-violet-50 rounded-3xl border border-violet-100 hover:border-violet-300 transition-all group">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                    <Mic size={32} className="text-violet-600" />
                                </div>
                                <span className="font-bold text-gray-900">Voice Record</span>
                            </button>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {isUploading ? (
                                    <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Upload size={24} />
                                        <span>Start Analysis</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-[2.5rem] shadow-xl border border-emerald-50 p-8 md:p-12 text-center space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={48} className="text-emerald-500" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Analysis Complete!</h2>
                        <p className="text-gray-500 font-medium">We've found 8 items from your list in nearby stores.</p>
                        <button
                            onClick={() => navigate('/customer/home')}
                            className="px-12 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                        >
                            Go to Home
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadList;
