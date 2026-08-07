declare module "*.css";
declare module "leaflet/dist/leaflet.css";
// src/global.d.ts
declare module '*.css' {
  const content: any;
  export default content;
}