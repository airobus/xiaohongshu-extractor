import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    // 提取实际的URL
    const extractedUrl = extractXHSUrl(url);
    if (!extractedUrl) {
      return NextResponse.json(
        { error: '无效的小红书链接' },
        { status: 400 }
      );
    }

    // 获取HTML内容
    const html = await fetchRawXiaohongshuContent(extractedUrl);
    
    // 解析HTML内容
    const content = parseXHSContent(html);
    
    return NextResponse.json(content);
    
  } catch (error) {
    console.error('Error fetching XHS content:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取内容失败' },
      { status: 500 }
    );
  }
}

async function fetchRawXiaohongshuContent(url: string): Promise<string> {
  try {
    // 移除URL中可能存在的多余协议前缀
    let cleanUrl = url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      cleanUrl = url.replace(/^https?:\/\//, '');
    }
    
    // 构建r.jina.ai的URL
    const jinaUrl = `https://r.jina.ai/${cleanUrl}`;
    console.log('爬取内容，使用URL:', jinaUrl);
    
    // 发送请求获取小红书内容
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
      const response = await fetch(jinaUrl, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          // 'Authorization': `Bearer ${JINA_API_KEY}`,
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`获取内容失败: ${response.status}`);
      }
      
      const html = await response.text();
      console.log('成功获取到原始HTML内容，长度:', html.length);
      
      return html;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('请求超时，请稍后重试');
      }
      throw error;
    }
  } catch (error) {
    console.error('Error fetching raw content:', error);
    throw new Error('获取小红书内容失败，请检查链接是否有效');
  }
}

function parseXHSContent(html: string) {
  try {
    // 提取标题
    const titleMatch = html.match(/Title:\s*(.*?)\s*(?:-\s*小红书|\n|$)/);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // 提取正文内容 - 查找包含 [#xxx] 标签的段落
    const paragraphMatch = html.match(/\n([^\n]+\[#[^\n]+)\n/);
    let text = '';
    
    if (paragraphMatch && paragraphMatch[1]) {
      // 获取完整段落内容
      text = paragraphMatch[1]
        .replace(/\[[\u4e00-\u9fa5a-zA-Z]+\s*R\]/g, '')  // 移除小红书表情包 [xxxR] 或 [xxx R]
        .replace(/\\\[[^[\]]*R\]/,'')
        .replace(/!\[.*?\]\(.*?\)/g, '')                  // 移除 Markdown 格式的图片链接
        .replace(/\]\([^)]+\)/g, ']')                     // 移除标签后的链接
        .replace(/\s+/g, ' ')                             // 合并空格
        .trim();
    }

    // 提取图片URL
    const images: string[] = [];
    const imgRegex = /!\[Image\s+\d+\]\((https:\/\/sns-webpic-qc\.xhscdn\.com\/[^)]+)\)/g;
    let match;
    
    while ((match = imgRegex.exec(html)) !== null) {
      if (match[1]) {  // match[1] 是括号中的完整URL
        const imgUrl = match[1];  // 保留完整URL，包括后缀
        if (!images.includes(imgUrl)) {
          images.push(imgUrl);
        }
      }
    }

    // 过滤并清理结果
    return {
      title: title.replace(/\|/g, ' | ').trim(),
      text: text || '未找到正文内容',
      images: images.filter(url => 
        !url.includes('avatar') && 
        !url.includes('icon') && 
        !url.includes('logo')
      )  // 不再需要 slice(0, 9)，因为我们只提取实际的笔记图片
    };
  } catch (error) {
    console.error('Error parsing content:', error);
    throw new Error('解析内容失败');
  }
}

function extractXHSUrl(text: string): string | null {
  // 匹配 xhslink.com 链接
  const xhslinkMatch = text.match(/https?:\/\/xhslink\.com\/[a-zA-Z0-9/]+/);
  if (xhslinkMatch) {
    return xhslinkMatch[0];
  }

  // 匹配小红书网页链接
  const xhsWebMatch = text.match(/https?:\/\/(?:www\.)?xiaohongshu\.com\/[^\s]+/);
  if (xhsWebMatch) {
    return xhsWebMatch[0];
  }

  // 如果输入的就是一个完整的URL，直接返回
  if (text.startsWith('http://') || text.startsWith('https://')) {
    return text;
  }

  return null;
}

function extractNoteId(url: string): string | null {
  // 处理不同格式的小红书链接
  const patterns = [
    /xhslink\.com\/([^?&\/]+)/,
    /xiaohongshu\.com\/discovery\/item\/([^?&\/]+)/,
    /([a-zA-Z0-9]{24})/  // 通用ID格式
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
} 