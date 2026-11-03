import React, { useRef, useEffect, useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';

export const PdfViewer = forwardRef(function PdfViewer(
  {
    pdfUrl,
    mode = 'vertical', // 'vertical' (novel) | 'paged' (comic)
    initialPage = 1,
    zoom = 1.0,
    onPageChange,
    onLoadSuccess,
    onError,
    style,
  },
  ref
) {
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const onPageChangeRef = useRef(onPageChange);
  const onLoadSuccessRef = useRef(onLoadSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onPageChangeRef.current = onPageChange;
    onLoadSuccessRef.current = onLoadSuccess;
    onErrorRef.current = onError;
  });

  const initialPageRef = useRef(initialPage);
  const initialModeRef = useRef(mode);
  const initialZoomRef = useRef(zoom);

  useEffect(() => {
    setLoading(true);
  }, [pdfUrl]);

  useImperativeHandle(ref, () => ({
    setPage: (page) => {
      if (webViewRef.current) {
        webViewRef.current.postMessage(
          JSON.stringify({ action: 'setPage', page: Number(page) })
        );
      }
    },
    setZoom: (newZoom) => {
      if (webViewRef.current) {
        webViewRef.current.postMessage(
          JSON.stringify({ action: 'setZoom', zoom: Number(newZoom) })
        );
      }
    },
    setMode: (newMode) => {
      if (webViewRef.current) {
        webViewRef.current.postMessage(
          JSON.stringify({ action: 'setMode', mode: newMode })
        );
      }
    },
  }));

  // Sync zoom changes to WebView without reloading document
  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({ action: 'setZoom', zoom: Number(zoom) })
      );
    }
  }, [zoom]);

  // Sync mode changes to WebView without reloading document
  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({ action: 'setMode', mode })
      );
    }
  }, [mode]);

  // HTML with embedded Mozilla PDF.js engine - strictly memoized per pdfUrl
  const pdfJsHtml = useMemo(() => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=4.0, minimum-scale=0.5, user-scalable=yes">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background-color: #0F172A;
      color: #F8FAFC;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      width: 100%;
      min-height: 100vh;
      overflow-x: hidden;
    }
    #viewer-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      padding: 12px 0 36px 0;
    }
    .page-wrapper {
      margin: 10px 0;
      box-shadow: 0 4px 14px rgba(0,0,0,0.45);
      background: #FFFFFF;
      border-radius: 4px;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
    }
    .page-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #64748B;
      font-size: 13px;
      background: #1E293B;
      width: 100%;
      height: 100%;
    }
    canvas {
      display: block;
      width: 100% !important;
      height: auto !important;
    }
    #status-msg {
      padding: 30px 16px;
      text-align: center;
      color: #94A3B8;
      font-size: 14px;
    }
    .spinner {
      margin: 20px auto;
      width: 36px;
      height: 36px;
      border: 3px solid rgba(255,255,255,0.2);
      border-top-color: #4F46E5;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .retry-btn {
      margin-top: 14px;
      background: #4F46E5;
      color: white;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div id="status-msg">
    <div class="spinner"></div>
    <div>Loading document...</div>
  </div>
  <div id="viewer-container"></div>

  <script>
    const PDF_URL = "${pdfUrl}";
    let pdfDoc = null;
    let currentMode = "${initialModeRef.current}";
    let currentPageNum = ${initialPageRef.current};
    let currentZoom = ${initialZoomRef.current};
    let renderedPages = new Set();
    let renderingPages = new Set();
    let observer = null;
    let baseAspectRatio = 1.414; // Default A4 aspect ratio
    let scrollListenerAttached = false;

    if (window.pdfjsLib) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    function notifyRN(data) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
    }

    async function loadPDF() {
      const statusDiv = document.getElementById('status-msg');
      statusDiv.style.display = 'block';
      statusDiv.innerHTML = '<div class="spinner"></div><div>Loading document...</div>';

      try {
        const loadingTask = pdfjsLib.getDocument({
          url: PDF_URL,
          enableXfa: false,
          withCredentials: false
        });
        pdfDoc = await loadingTask.promise;
        
        // Inspect page 1 for precise aspect ratio
        try {
          const firstPage = await pdfDoc.getPage(1);
          const vp = firstPage.getViewport({ scale: 1.0 });
          baseAspectRatio = vp.height / vp.width;
        } catch (e) {}

        statusDiv.style.display = 'none';
        notifyRN({ type: 'loadSuccess', totalPages: pdfDoc.numPages });
        
        renderCurrentView();
      } catch (err) {
        console.error('PDF load error:', err);
        statusDiv.innerHTML = 
          '<div style="color:#EF4444;padding:20px;">' +
          '<strong>Failed to load document</strong><br>' +
          '<span style="font-size:12px;color:#94A3B8;">' + (err.message || 'Network or CORS restriction') + '</span><br>' +
          '<button class="retry-btn" onclick="loadPDF()">Retry Loading</button>' +
          '</div>';
        notifyRN({ type: 'error', message: err.message });
      }
    }

    async function renderPage(pageNum, targetContainer) {
      if (!pdfDoc || renderingPages.has(pageNum)) return;
      renderingPages.add(pageNum);

      try {
        const page = await pdfDoc.getPage(pageNum);
        const containerWidth = Math.min(window.innerWidth * 0.94, 900);
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const scale = (containerWidth / unscaledViewport.width) * currentZoom;
        const dpr = window.devicePixelRatio || 1.5;
        const viewport = page.getViewport({ scale: scale * dpr });

        let wrapper = document.getElementById('page-wrapper-' + pageNum);
        if (!wrapper) {
          wrapper = document.createElement('div');
          wrapper.id = 'page-wrapper-' + pageNum;
          wrapper.className = 'page-wrapper';
          wrapper.dataset.page = pageNum;
          targetContainer.appendChild(wrapper);
        }

        let canvas = wrapper.querySelector('canvas');
        if (!canvas) {
          canvas = document.createElement('canvas');
          wrapper.innerHTML = '';
          wrapper.appendChild(canvas);
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = (viewport.width / dpr) + 'px';
        canvas.style.height = (viewport.height / dpr) + 'px';
        wrapper.style.minHeight = (viewport.height / dpr) + 'px';

        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        renderedPages.add(pageNum);
      } catch (e) {
        console.error('Render page error for ' + pageNum, e);
      } finally {
        renderingPages.delete(pageNum);
      }
    }

    async function renderCurrentView() {
      if (!pdfDoc) return;
      const container = document.getElementById('viewer-container');
      container.innerHTML = '';
      renderedPages.clear();
      renderingPages.clear();

      if (observer) {
        observer.disconnect();
        observer = null;
      }

      if (currentMode === 'vertical') {
        const containerWidth = Math.min(window.innerWidth * 0.94, 900);
        const estimatedHeight = containerWidth * baseAspectRatio * currentZoom;

        // Create virtualized wrappers for all pages
        for (let num = 1; num <= pdfDoc.numPages; num++) {
          const wrapper = document.createElement('div');
          wrapper.id = 'page-wrapper-' + num;
          wrapper.className = 'page-wrapper';
          wrapper.dataset.page = num;
          wrapper.style.width = containerWidth + 'px';
          wrapper.style.minHeight = estimatedHeight + 'px';
          wrapper.innerHTML = '<div class="page-placeholder"><span>Page ' + num + '</span></div>';
          container.appendChild(wrapper);
        }

        // Setup IntersectionObserver for on-demand lazy rendering (handles 100+ pages effortlessly)
        observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            const pageNum = parseInt(entry.target.dataset.page, 10);
            if (entry.isIntersecting) {
              if (!renderedPages.has(pageNum)) {
                renderPage(pageNum, container);
              }
            }
          });
        }, { rootMargin: '400px 0px' });

        document.querySelectorAll('.page-wrapper').forEach(w => observer.observe(w));

        // Render target page immediately
        await renderPage(currentPageNum, container);
        if (currentPageNum > 1) {
          renderPage(currentPageNum - 1, container);
        }
        if (currentPageNum < pdfDoc.numPages) {
          renderPage(currentPageNum + 1, container);
        }

        setupScrollListener();

        // Scroll to initial page
        setTimeout(() => {
          const target = document.getElementById('page-wrapper-' + currentPageNum);
          if (target) target.scrollIntoView({ behavior: 'auto' });
        }, 150);
      } else {
        // Comic mode: render only current page
        await renderPage(currentPageNum, container);
      }
    }

    function setupScrollListener() {
      if (scrollListenerAttached) return;
      scrollListenerAttached = true;
      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const wrappers = document.querySelectorAll('.page-wrapper');
            let visiblePage = currentPageNum;
            const mid = window.innerHeight / 2;

            wrappers.forEach(w => {
              const rect = w.getBoundingClientRect();
              if (rect.top <= mid && rect.bottom >= mid) {
                visiblePage = parseInt(w.dataset.page, 10);
              }
            });

            if (visiblePage !== currentPageNum) {
              currentPageNum = visiblePage;
              notifyRN({ type: 'pageChange', page: currentPageNum, totalPages: pdfDoc.numPages });
            }
            ticking = false;
          });
          ticking = true;
        }
      });
    }

    // Message handler
    window.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.action === 'setPage') {
          currentPageNum = Math.max(1, Math.min(pdfDoc ? pdfDoc.numPages : 1, msg.page));
          if (currentMode === 'paged') {
            renderCurrentView();
          } else {
            const target = document.getElementById('page-wrapper-' + currentPageNum);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
          }
          notifyRN({ type: 'pageChange', page: currentPageNum, totalPages: pdfDoc.numPages });
        } else if (msg.action === 'setZoom') {
          currentZoom = msg.zoom;
          renderCurrentView();
        } else if (msg.action === 'setMode') {
          currentMode = msg.mode;
          renderCurrentView();
        }
      } catch (e) {
        console.error('RN message error', e);
      }
    });

    document.addEventListener('message', (event) => {
      window.dispatchEvent(new MessageEvent('message', { data: event.data }));
    });

    loadPDF();
  </script>
</body>
</html>
    `;
  }, [pdfUrl]);

  const webViewSource = useMemo(() => ({ html: pdfJsHtml, baseUrl: '' }), [pdfJsHtml]);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'loadSuccess') {
        setLoading(false);
        setTotalPages(data.totalPages);
        if (onLoadSuccessRef.current) onLoadSuccessRef.current(data.totalPages);
      } else if (data.type === 'pageChange') {
        setCurrentPage(data.page);
        if (onPageChangeRef.current) onPageChangeRef.current(data.page, data.totalPages);
      } else if (data.type === 'error') {
        setLoading(false);
        if (onErrorRef.current) onErrorRef.current(data.message);
      }
    } catch (e) {
      console.warn('WebView parse error:', e);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[TYPOGRAPHY.caption, styles.loadingText]}>
            Rendering PDF document...
          </Text>
        </View>
      )}
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={webViewSource}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        scalesPageToFit={true}
        mixedContentMode="always"
        onMessage={handleMessage}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
  },
});
