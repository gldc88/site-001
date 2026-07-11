import { Fragment } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from './useReducedMotion';

interface TextSplitProps {
  text: string;
  className?: string;
}

export default function TextSplit({ text, className }: TextSplitProps) {
  const reduced = useReducedMotion();
  const words = text.split(' ');

  if (reduced) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className} aria-label={text}>
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <motion.span
            aria-hidden="true"
            className="inline-block"
            initial={{ opacity: 0, y: '0.7em' }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.55, delay: index * 0.035, ease: [0.22, 1, 0.36, 1] }}
          >
            {word}
          </motion.span>
          {index < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </span>
  );
}
