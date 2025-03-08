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
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-50 py-12">
      <div className="max-w-3xl mx-auto p-6 space-y-8">
        {/* 标题区域 */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            小红书内容提取
          </h1>
          <p className="text-sm text-gray-500">
            输入小红书笔记链接，一键获取图文内容
          </p>
        </div>

        {/* 输入表单 */}
        <div className="mt-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <input
                id="xhs-url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl
                         bg-white border-2 border-rose-100
                         text-gray-900 placeholder:text-gray-400
                         shadow-[0_0_0_0] shadow-rose-500/50
                         focus:border-rose-500 focus:shadow-[0_0_15px_2px]
                         transition-all duration-300 ease-out
                         group-hover:border-rose-300"
                placeholder="在此粘贴小红书笔记链接"
                aria-label="小红书笔记链接输入框"
              />
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2
                         px-6 py-2.5 rounded-xl
                         bg-rose-500 text-white font-medium
                         hover:bg-rose-600 active:bg-rose-700
                         disabled:bg-gray-300 disabled:cursor-not-allowed
                         shadow-lg shadow-rose-500/30
                         transition-all duration-300 ease-out
                         hover:shadow-rose-500/50"
                aria-label="获取笔记内容"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    获取中
                  </span>
                ) : '提取内容'}
              </button>
            </div>
          </form>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-500 border border-red-100" role="alert">
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
              <div className="bg-white rounded-2xl p-6 shadow-lg shadow-rose-500/5 border border-rose-100">
                <h3 className="text-xl font-bold text-gray-900">{result.title}</h3>
              </div>
            )}
            
            {/* 文本内容 */}
            {result.text && (
              <div className="bg-white rounded-2xl p-6 shadow-lg shadow-rose-500/5 border border-rose-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">笔记内容</h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {result.text}
                </p>
              </div>
            )}
            
            {/* 图片展示 */}
            {result.images && result.images.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg shadow-rose-500/5 border border-rose-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">图片内容</h3>
                <div className="grid grid-cols-2 gap-4">
                  {result.images.map((image, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img
                        src={image}
                        alt={`笔记图片 ${index + 1}`}
                        className="absolute inset-0 w-full h-full object-cover 
                                 transition duration-300 ease-out
                                 group-hover:scale-105"
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
    </div>
  );
};

export default XHSFetcher; 