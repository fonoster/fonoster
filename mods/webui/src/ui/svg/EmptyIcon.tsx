import React from 'react'

import { classes } from '@/mods/shared/helpers/classes'

export const EmptyIcon: React.FC<React.HTMLAttributes<SVGAElement>> = ({
  className,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="42.711"
    height="32.033"
    viewBox="0 0 42.711 32.033"
    className={classes('h-full', className)}
  >
    <path
      d="M38.707,69.339H22.69l-4.557-4.557A2.67,2.67,0,0,0,16.245,64H4a4,4,0,0,0-4,4V92.029a4,4,0,0,0,4,4h34.7a4,4,0,0,0,4-4V73.343A4,4,0,0,0,38.707,69.339Zm0,22.69H4V68H15.693l4.557,4.557a2.67,2.67,0,0,0,1.888.782H38.707Z"
      transform="translate(0 -64)"
      fill="rgba(255,255,255,0.5)"
    />
  </svg>
)
