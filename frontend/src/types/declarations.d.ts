declare module 'lucide-react';

declare module 'animejs' {
  export type Scope = any;
  export function animate(...args: any[]): any;
  export function createScope(...args: any[]): any;
  export function stagger(...args: any[]): any;
  export function remove(...args: any[]): any;
  const anime: any;
  export default anime;
}
