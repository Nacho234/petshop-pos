// Runs before paint to set the `.dark` class and avoid a flash of the wrong theme.
export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem('caja-theme');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var dark=t==='dark'||((!t||t==='system')&&m);document.documentElement.classList.toggle('dark',dark);}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
