import { useEffect } from 'react';

function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · HustleHub+` : 'HustleHub+';
    return () => {
      document.title = previous;
    };
  }, [title]);
}

export default useDocumentTitle;
