import React, { useState, useRef } from 'react';
import {
    X,
    Upload,
    Camera,
    Loader2,
    Check,
    AlertCircle,
    Plus,
    Trash2,
    ChevronDown
} from 'lucide-react';
import { api } from '@/lib/api';

interface ProcessedItem {
    original: string;
    matched: {
        id: string;
        name: string;
        price: number;
        category: string;
        image: string;
    } | null;
    suggestions: {
        id: string;
        name: string;
        price: number;
    }[];
    status: 'matched' | 'not_available';
}

interface GroceryListModalProps {
    isOpen: boolean;
    onClose: () => void;
    ownerId: string;
    onConfirm: (items: any[]) => void;
}

const GroceryListModal: React.FC<GroceryListModalProps> = ({ isOpen, onClose, ownerId, onConfirm }) => {
    const [step, setStep] = useState<'upload' | 'processing' | 'review'>('upload');
    const [results, setResults] = useState<ProcessedItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        processFile(file);
    };

    const processFile = async (file: File) => {
        setLoading(true);
        setStep('processing');
        setError(null);
        try {
            const data = await api.customer.uploadGroceryList(ownerId, file);
            setResults(data.results);
            setStep('review');
        } catch (err: any) {
            setError(err.message || 'Failed to process image');
            setStep('upload');
        } finally {
            setLoading(false);
        }
    };

    const toggleItem = (index: number) => {
        const newResults = [...results];
        if (newResults[index].status === 'matched') {
            newResults[index].status = 'not_available'; // Treat as unchecked
        } else if (newResults[index].matched) {
            newResults[index].status = 'matched';
        }
        setResults(newResults);
    };

    const selectSuggestion = (itemIndex: number, suggestion: any) => {
        const newResults = [...results];
        newResults[itemIndex].matched = {
            ...suggestion,
            category: '', // Placeholder or fetch if needed
            image: ''
        };
        newResults[itemIndex].status = 'matched';
        setResults(newResults);
    };

    const handleConfirm = () => {
        const selectedItems = results
            .filter(r => r.status === 'matched' && r.matched)
            .map(r => ({
                ...r.matched,
                quantity: 1
            }));
        onConfirm(selectedItems);
        onClose();
        setStep('upload');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-800">Upload Grocery List</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    {step === 'upload' && (
                        <div className="space-y-6">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
                            >
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Upload className="w-8 h-8 text-primary" />
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-semibold text-gray-700">Click to upload or drag & drop</p>
                                    <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-px bg-gray-100"></div>
                                <span className="text-sm text-gray-400 font-medium">OR</span>
                                <div className="flex-1 h-px bg-gray-100"></div>
                            </div>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary hover:text-white transition-all active:scale-[0.98]"
                            >
                                <Camera className="w-5 h-5" />
                                Use Camera
                            </button>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex gap-3 animate-in slide-in-from-top-2">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="py-20 flex flex-col items-center justify-center gap-6">
                            <div className="relative">
                                <div className="w-20 h-20 border-4 border-primary/20 rounded-full"></div>
                                <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0"></div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-gray-800">Processing Your List</h3>
                                <p className="text-gray-500 mt-2">Gemini is extracting and matching your items...</p>
                            </div>
                        </div>
                    )}

                    {step === 'review' && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500 font-medium px-1">We found these items in the store's inventory:</p>

                            <div className="space-y-3">
                                {results.map((item, idx) => (
                                    <div key={idx} className={`p-4 rounded-xl border-2 transition-all ${item.status === 'matched' ? 'border-primary/20 bg-primary/5' : 'border-gray-100 bg-gray-50'
                                        }`}>
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                                    Extracted: "{item.original}"
                                                </p>
                                                {item.matched ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-gray-800">{item.matched.name}</span>
                                                        <span className="text-sm text-primary font-semibold">₹{item.matched.price}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic">No exact match found</span>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => toggleItem(idx)}
                                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${item.status === 'matched'
                                                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                                        : 'bg-white border-2 border-gray-200 text-gray-300'
                                                    }`}
                                            >
                                                {item.status === 'matched' ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                            </button>
                                        </div>

                                        {item.suggestions.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-gray-200/50">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Similar Products:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {item.suggestions.map((s, sIdx) => (
                                                        <button
                                                            key={sIdx}
                                                            onClick={() => selectSuggestion(idx, s)}
                                                            className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-medium hover:border-primary hover:text-primary transition-all shadow-sm"
                                                        >
                                                            {s.name} - ₹{s.price}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {step === 'review' && (
                    <div className="px-6 py-4 border-t bg-gray-50/50 flex gap-3">
                        <button
                            onClick={() => setStep('upload')}
                            className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex-[2] py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:opacity-90 active:scale-[0.98] transition-all"
                        >
                            Add Selected to Cart
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GroceryListModal;
