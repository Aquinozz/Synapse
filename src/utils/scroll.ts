/** The element the page scrolls in: #root while a colour-vision mode is on, the window otherwise */
const pageScroller = () => document.getElementById('root');

export const getPageScroll = () => window.scrollY || pageScroller()?.scrollTop || 0;

export const setPageScroll = (top: number) => {
  window.scrollTo({ top });
  pageScroller()?.scrollTo({ top });
};

export const scrollPageToTop = () => setPageScroll(0);
