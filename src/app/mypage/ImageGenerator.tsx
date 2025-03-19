'use client';

import React, { useState } from 'react';

interface ImageGeneratorProps {
  apiCallsRemaining: number;
}

export default function ImageGenerator({ apiCallsRemaining }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError('プロンプトを入力してください');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/fal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'エラーが発生しました');
      }
      
      setGeneratedImage(data.imageUrl);
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h3 className="text-lg font-medium mb-4">画像生成</h3>
      
      {apiCallsRemaining <= 0 && (
        <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 rounded-md">
          API コールの上限に達しました。プランをアップグレードするか、次回のリセット日をお待ちください。
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
            プロンプト
          </label>
          <textarea
            id="prompt"
            name="prompt"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="生成したい画像の説明を入力してください..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading || apiCallsRemaining <= 0}
          />
        </div>
        <button
          type="submit"
          className={`w-full px-4 py-2 rounded-md text-white transition-colors ${
            isLoading || apiCallsRemaining <= 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
          disabled={isLoading || apiCallsRemaining <= 0}
        >
          {isLoading ? '生成中...' : '画像を生成'}
        </button>
      </form>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-md">
          {error}
        </div>
      )}
      
      <div className="mt-8">
        <h4 className="text-md font-medium mb-2">生成結果</h4>
        <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
          {generatedImage ? (
            <img 
              src={generatedImage} 
              alt="Generated image" 
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <p className="text-gray-500">画像が生成されるとここに表示されます</p>
          )}
        </div>
      </div>
    </div>
  );
}
