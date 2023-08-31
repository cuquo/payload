import * as facelessui from '@faceless-ui/modal'
const { useModal } = facelessui
import React, { Fragment, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Editor, Range, Transforms } from 'slate'
import { ReactEditor, useSlate } from 'slate-react'

import type { Fields } from '../../../../../Form/types.js'
import type { Props as RichTextFieldProps } from '../../../types.js'

import { useDrawerSlug } from '../../../../../../elements/Drawer/useDrawerSlug.js'
import LinkIcon from '../../../../../../icons/Link/index.js'
import { useAuth } from '../../../../../../utilities/Auth/index.js'
import { useConfig } from '../../../../../../utilities/Config/index.js'
import { useDocumentInfo } from '../../../../../../utilities/DocumentInfo/index.js'
import { useLocale } from '../../../../../../utilities/Locale/index.js'
import buildStateFromSchema from '../../../../../Form/buildStateFromSchema/index.js'
import reduceFieldsToValues from '../../../../../Form/reduceFieldsToValues.js'
import ElementButton from '../../Button.js'
import isElementActive from '../../isActive.js'
import { LinkDrawer } from '../LinkDrawer/index.js'
import { transformExtraFields, unwrapLink } from '../utilities.js'

/**
 * This function is called when an new link is created - not when an existing link is edited.
 */
const insertLink = (editor, fields) => {
  const isCollapsed = editor.selection && Range.isCollapsed(editor.selection)
  const data = reduceFieldsToValues(fields, true)

  const newLink = {
    children: [],
    doc: data.doc,
    fields: data.fields, // Any custom user-added fields are part of data.fields
    linkType: data.linkType,
    newTab: data.newTab,
    type: 'link',
    url: data.url,
  }

  if (isCollapsed || !editor.selection) {
    // If selection anchor and focus are the same,
    // Just inject a new node with children already set
    Transforms.insertNodes(editor, {
      ...newLink,
      children: [{ text: String(data.text) }],
    })
  } else if (editor.selection) {
    // Otherwise we need to wrap the selected node in a link,
    // Delete its old text,
    // Move the selection one position forward into the link,
    // And insert the text back into the new link
    Transforms.wrapNodes(editor, newLink, { split: true })
    Transforms.delete(editor, { at: editor.selection.focus.path, unit: 'word' })
    Transforms.move(editor, { distance: 1, unit: 'offset' })
    Transforms.insertText(editor, String(data.text), { at: editor.selection.focus.path })
  }

  ReactEditor.focus(editor)
}

export const LinkButton: React.FC<{
  fieldProps: RichTextFieldProps
  path: string
}> = ({ fieldProps }) => {
  const customFieldSchema = fieldProps?.admin?.link?.fields
  const { user } = useAuth()
  const { code: locale } = useLocale()
  const [initialState, setInitialState] = useState<Fields>({})

  const { i18n, t } = useTranslation(['upload', 'general'])
  const editor = useSlate()
  const config = useConfig()

  const [fieldSchema] = useState(() => {
    const fields = transformExtraFields(customFieldSchema, config, i18n)

    return fields
  })

  const { closeModal, openModal } = useModal()
  const drawerSlug = useDrawerSlug('rich-text-link')
  const { getDocPreferences } = useDocumentInfo()

  return (
    <Fragment>
      <ElementButton
        onClick={async () => {
          if (isElementActive(editor, 'link')) {
            unwrapLink(editor)
          } else {
            openModal(drawerSlug)

            const isCollapsed = editor.selection && Range.isCollapsed(editor.selection)

            if (!isCollapsed) {
              const data = {
                text: editor.selection ? Editor.string(editor, editor.selection) : '',
              }

              const preferences = await getDocPreferences()
              const state = await buildStateFromSchema({
                data,
                fieldSchema,
                locale,
                operation: 'create',
                preferences,
                t: t as any,
                user,
              })
              setInitialState(state)
            }
          }
        }}
        className="link"
        format="link"
        tooltip={t('fields:addLink')}
      >
        <LinkIcon />
      </ElementButton>
      <LinkDrawer
        handleClose={() => {
          closeModal(drawerSlug)
        }}
        handleModalSubmit={(fields) => {
          insertLink(editor, fields)
          closeModal(drawerSlug)
        }}
        drawerSlug={drawerSlug}
        fieldSchema={fieldSchema}
        initialState={initialState}
      />
    </Fragment>
  )
}
