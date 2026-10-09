import { LatLng } from '@/types/map.types';
import { googleEmbedUrl } from '@/utils/geo.utils';

interface GoogleMapEmbedProps {
  point: LatLng;
  zoom: number;
  title: string;
  sizeClassName?: string;
}

export default function GoogleMapEmbed({
  point,
  zoom,
  title,
  sizeClassName = 'h-80 sm:h-[26rem]',
}: GoogleMapEmbedProps) {
  return (
    <iframe
      key={`${point.lat},${point.lng},${zoom}`}
      title={title}
      src={googleEmbedUrl(point, zoom)}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
      className={`block w-full rounded-modal border border-glass/70 bg-glass/42 shadow-glass ${sizeClassName}`}
    />
  );
}
