const mascotUrl = "/_cdn/static/a4079e52-9eb8-4083-a066-36a01bc1a5d2-xiaoqian-reading.webp";

export function XiaoQian({ size = 110, className = "" }: { size?: number; className?: string }) {
  return <img src={mascotUrl} className={className} width={size} height={size} alt="" draggable={false} />;
}
