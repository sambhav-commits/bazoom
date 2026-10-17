import type { Metadata } from 'next';
import './styles.css';
import './redesign.css';
export const metadata: Metadata = {
  title: 'NovaDrive | Supplier Continuity',
  description: 'An evidence-led CRO decision workspace for supplier continuity.'
};
export default function Layout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
