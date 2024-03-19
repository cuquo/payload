import type { SanitizedCollectionConfig, TypeWithID } from 'payload/types'

import React from 'react'

import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { formatDocTitle } from '../../utilities/formatDocTitle.js'
import { Thumbnail } from '../Thumbnail/index.js'
import './index.scss'

export type ThumbnailCardProps = {
  alignLabel?: 'center' | 'left'
  className?: string
  collection?: SanitizedCollectionConfig
  doc?: TypeWithID & { filename?: string }
  label?: string
  onClick?: () => void
  onKeyDown?: () => void
  thumbnail?: React.ReactNode
}

const baseClass = 'thumbnail-card'

export const ThumbnailCard: React.FC<ThumbnailCardProps> = (props) => {
  const {
    alignLabel,
    className,
    collection,
    doc,
    label: labelFromProps,
    onClick,
    thumbnail,
  } = props

  const config = useConfig()

  const { i18n, t } = useTranslation()

  const classes = [
    baseClass,
    className,
    typeof onClick === 'function' && `${baseClass}--has-on-click`,
    alignLabel && `${baseClass}--align-label-${alignLabel}`,
  ]
    .filter(Boolean)
    .join(' ')

  let title = labelFromProps

  if (!title) {
    title = formatDocTitle({
      collectionConfig: collection,
      data: doc,
      dateFormat: config.admin.dateFormat,
      fallback: doc?.filename,
      i18n,
    })
  }

  return (
    <button className={classes} onClick={onClick} title={title} type="button">
      <div className={`${baseClass}__thumbnail`}>
        {thumbnail && thumbnail}
        {!thumbnail && collection && doc && <Thumbnail doc={doc} size="expand" />}
      </div>
      <div className={`${baseClass}__label`}>{title}</div>
    </button>
  )
}
