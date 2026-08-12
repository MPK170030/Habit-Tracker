import baseForm        from '../assets/images/Goku-Base-Form.png';
import ultraInstinct   from '../assets/images/Goku-Ultra-Instinct.png';
import superSaiyan     from '../assets/images/Super-Saiyan-Goku.png';
import superSaiyan2    from '../assets/images/Super-Saiyan-2-Goku.png';
import superSaiyan3    from '../assets/images/Super-Saiyan-3-Goku.png';
import superSaiyanGod  from '../assets/images/Super-Saiyan-God-Goku.png';
import superSaiyanBlue from '../assets/images/Super-Saiyan-Blue-Goku.png';

const FORM_IMAGES: Record<number, string> = {
  1: baseForm,
  2: ultraInstinct,
  3: superSaiyan,
  4: superSaiyan2,
  5: superSaiyan3,
  6: superSaiyanGod,
  7: superSaiyanBlue,
};

export function GokuAvatar({ level }: { level: number }) {
  const src = FORM_IMAGES[level] ?? FORM_IMAGES[7];
  return (
    <img
      src={src}
      alt={`Goku — level ${level} form`}
      draggable={false}
      className="w-full h-full object-contain object-bottom select-none"
    />
  );
}
