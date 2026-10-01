/**
 * Synapse logo files, in public/images/logo.
 * Besides the ones the app uses below, the folder has every shape (simbolo, nome, horizontal,
 * vertical) in three renderings: `cor` (the original pastel), `contraste` (solid strokes, for
 * small sizes and light backgrounds) and `branco` (for dark or gradient backgrounds).
 */
const LOGO_DIR = '/images/logo';
export const LOGOS = {
  symbol: {
    contrast: `${LOGO_DIR}/synapse-simbolo-contraste-160.png`,
    white: `${LOGO_DIR}/synapse-simbolo-branco-160.png`,
  },
  horizontal: {
    contrast: `${LOGO_DIR}/synapse-horizontal-contraste-480.png`,
    white: `${LOGO_DIR}/synapse-horizontal-branco-480.png`,
  },
} as const;

/**
 * Remote demo photos
 */
export const IMAGES = {
  camila: "https://lh3.googleusercontent.com/aida-public/AB6AXuAO6Tm06O99ZG9HfukQv3m1V0ugstZBV9x-qLRTB4NK6tRr_auJlHG9fi5ujMVWF7RZrPcSxdLeeyEZMPB_hDBl4kAlYrt9oJqfNi8Ee-hhe3u8zBS38VAfFFwMyJi6bpSS7VlbX19bLyCMMJHSBgWCNZg2dW2jMpKJq9HlfQOBlPkb85MjN3nLce4Vdjw_KP0iyy7OjNqLChLXhkE1bA1it-omPHdXe9jiY0B0uuTdl8ICrb8XU8wobg",
  lucas: "https://lh3.googleusercontent.com/aida-public/AB6AXuAYgNjFOgXdfKJq1jOuXeS8TrLHBjGE964FLzq3eiBpYtPNCoQv135pQEmg25_ItuvXYfxDf8zOmOPr1KRBG54wHpGTFwdVZCi-qcg2Gye6VvyqOCMB6WeGy-vAEksi8CfJg4iIbUOoHJKcMUtmSSpe3vZFeThGcuY8Ivjt7keb1qpdHV9NtrpqowfdV_2K6cZBNiz7JjXnuI_4FmvgkwSov0i3TUDcUHelCg0utNirb6kphdxq5ZE8BQ",
  beatriz: "https://lh3.googleusercontent.com/aida-public/AB6AXuDTcussIvXMZ6-bvnbW1wpvuE3U1sXzeNxJqPmhuw1jOt7MPI_LVuV6lDG5uA-ArquFZ8ePlVFNuYW4S_XeKrOlGCt-Gsd8LAD7fiX2x7z8cgGs3CqlwAbkEFtXfA1S6HyUR7j3kPxx4OyBdHkPjAzlmEGWGgkFFUnYTkNgP3SNpBCwrrj71eMK12O8MPMofls8ol_v4P1GO-EyIKXrnHlzgXxFFKF_c_ht_jY-0U4FNFSh17rp-RW2Fw",
  userMarina: "https://lh3.googleusercontent.com/aida-public/AB6AXuAO6Tm06O99ZG9HfukQv3m1V0ugstZBV9x-qLRTB4NK6tRr_auJlHG9fi5ujMVWF7RZrPcSxdLeeyEZMPB_hDBl4kAlYrt9oJqfNi8Ee-hhe3u8zBS38VAfFFwMyJi6bpSS7VlbX19bLyCMMJHSBgWCNZg2dW2jMpKJq9HlfQOBlPkb85MjN3nLce4Vdjw_KP0iyy7OjNqLChLXhkE1bA1it-omPHdXe9jiY0B0uuTdl8ICrb8XU8wobg",
};
