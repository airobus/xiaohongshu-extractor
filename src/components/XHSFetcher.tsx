"use client";

import { useState } from 'react';

interface FetchResult {
  title: string;
  text: string;
  images: string[];
}

const XHSFetcher = () => {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<FetchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);  // 清除之前的结果
    
    try {
      const response = await fetch('/api/fetch-xhs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      if (!response.ok) {
        throw new Error('获取失败');
      }
      
      const data = await response.json();
      // 只有当有内容时才设置结果
      if (data.text?.trim() || (data.images && data.images.length > 0)) {
        setResult(data);
        setUrl(''); // 清空输入框
      } else {
        throw new Error('未找到有效内容');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      {/* 标题 */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-medium text-gray-900">小红书内容提取</h1>
        <p className="text-sm text-gray-500">粘贴小红书笔记链接，获取图文内容</p>
      </div>

      {/* 输入表单 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            id="xhs-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border-0 bg-gray-50/80 
                     text-gray-900 placeholder:text-gray-400
                     focus:ring-2 focus:ring-blue-500/20 focus:outline-none
                     transition duration-200 ease-in-out"
            placeholder="在此粘贴小红书笔记链接"
            aria-label="小红书笔记链接输入框"
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2
                     px-4 py-1.5 rounded-xl
                     bg-blue-500 text-white text-sm font-medium
                     hover:bg-blue-600 active:bg-blue-700
                     disabled:bg-gray-300 disabled:cursor-not-allowed
                     transition duration-200 ease-in-out
                     focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            aria-label="获取笔记内容"
          >
            {loading ? '获取中...' : '提取内容'}
          </button>
        </div>
      </form>

      {/* 错误提示 */}
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-500" role="alert">
          <p className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
            </svg>
            {error}
          </p>
        </div>
      )}

      {/* 结果展示 */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* 标题 */}
          {result.title && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900">{result.title}</h3>
            </div>
          )}
          
          {/* 文本内容 */}
          {result.text && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">笔记内容</h3>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {result.text}
              </p>
            </div>
          )}
          
          {/* 图片展示 */}
          {result.images && result.images.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">图片内容</h3>
              <div className="grid grid-cols-2 gap-4">
                {result.images.map((image, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden">
                    <img
                      src={image}
                      alt={`笔记图片 ${index + 1}`}
                      className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default XHSFetcher; 