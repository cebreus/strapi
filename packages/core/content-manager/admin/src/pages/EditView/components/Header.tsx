import * as React from 'react';

import {
  DescriptionComponentRenderer,
  useForm,
  BackButton,
  useNotification,
  useStrapiApp,
  useQueryParams,
} from '@strapi/admin/strapi-admin';
import { Flex, SingleSelect, SingleSelectOption, Typography } from '@strapi/design-system';
import { Cog, Pencil, Trash, WarningCircle } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useMatch, useNavigate } from 'react-router-dom';
import { styled } from 'styled-components';

import { RelativeTime } from '../../../components/RelativeTime';
import {
  CREATED_AT_ATTRIBUTE_NAME,
  CREATED_BY_ATTRIBUTE_NAME,
  PUBLISHED_AT_ATTRIBUTE_NAME,
  PUBLISHED_BY_ATTRIBUTE_NAME,
  UPDATED_AT_ATTRIBUTE_NAME,
  UPDATED_BY_ATTRIBUTE_NAME,
} from '../../../constants/attributes';
import { SINGLE_TYPES } from '../../../constants/collections';
import { useDocumentRBAC } from '../../../features/DocumentRBAC';
import { useDoc } from '../../../hooks/useDocument';
import { useDocumentActions } from '../../../hooks/useDocumentActions';
import { CLONE_PATH, LIST_PATH } from '../../../router';
import { getDisplayName } from '../../../utils/users';

import { DocumentActionsMenu } from './DocumentActions';
import { DocumentStatus } from './DocumentStatus';

import type { ContentManagerPlugin, DocumentActionComponent } from '../../../content-manager';

/* -------------------------------------------------------------------------------------------------
 * Header
 * -----------------------------------------------------------------------------------------------*/

interface HeaderProps {
  isCreating?: boolean;
  status?: 'draft' | 'published' | 'modified';
  title?: string;
}

const Header = ({ isCreating, status, title: documentTitle = 'Untitled' }: HeaderProps) => {
  const { formatMessage } = useIntl();
  const isCloning = useMatch(CLONE_PATH) !== null;

  const title = isCreating
    ? formatMessage({
        id: 'content-manager.containers.edit.title.new',
        defaultMessage: 'Create an entry',
      })
    : documentTitle;

  return (
    <Flex direction="column" alignItems="flex-start" paddingTop={8} paddingBottom={4} gap={3}>
      <BackButton />
      <Flex
        width="100%"
        justifyContent="space-between"
        paddingTop={1}
        gap="80px"
        alignItems="flex-start"
      >
        <Typography variant="alpha" tag="h1">
          {title}
        </Typography>
        <HeaderToolbar />
      </Flex>
      {status ? <DocumentStatus status={isCloning ? 'draft' : status} /> : null}
    </Flex>
  );
};

/* -------------------------------------------------------------------------------------------------
 * HeaderToolbar
 * -----------------------------------------------------------------------------------------------*/

interface HeaderButtonAction {
  disabled?: boolean;
  label: string;
  icon?: React.ReactNode;
  /**
   * @default 'default'
   */
  type?: 'icon' | 'default';
  onClick?: (event: React.SyntheticEvent) => void;
}

interface HeaderSelectAction {
  disabled?: boolean;
  label: string;
  options: Array<{
    disabled?: boolean;
    label: string;
    startIcon?: React.ReactNode;
    textValue?: string;
    value: string;
  }>;
  onSelect?: (value: string) => void;
  value?: string;
}

type HeaderActionDescription = HeaderButtonAction | HeaderSelectAction;

/**
 * @description Contains the document actions that have `position: header`, if there are
 * none we still render the menu because we render the information about the document there.
 */
const HeaderToolbar = () => {
  const { formatMessage } = useIntl();
  const isCloning = useMatch(CLONE_PATH) !== null;
  const [
    {
      query: { status = 'draft' },
    },
  ] = useQueryParams<{ status: 'draft' | 'published' }>();
  const { model, id, document, meta, collectionType } = useDoc();
  const plugins = useStrapiApp('HeaderToolbar', (state) => state.plugins);

  return (
    <Flex gap={2}>
      <DescriptionComponentRenderer
        props={{
          activeTab: status,
          model,
          documentId: id,
          document: isCloning ? undefined : document,
          meta: isCloning ? undefined : meta,
          collectionType,
        }}
        descriptions={(
          plugins['content-manager'].apis as ContentManagerPlugin['config']['apis']
        ).getHeaderActions()}
      >
        {(actions) => {
          if (actions.length > 0) {
            return <HeaderActions actions={actions} />;
          } else {
            return null;
          }
        }}
      </DescriptionComponentRenderer>
      <DescriptionComponentRenderer
        props={{
          activeTab: status,
          model,
          documentId: id,
          document: isCloning ? undefined : document,
          meta: isCloning ? undefined : meta,
          collectionType,
        }}
        descriptions={(
          plugins['content-manager'].apis as ContentManagerPlugin['config']['apis']
        ).getDocumentActions()}
      >
        {(actions) => {
          const headerActions = actions.filter((action) => {
            const positions = Array.isArray(action.position) ? action.position : [action.position];
            return positions.includes('header');
          });

          return (
            <DocumentActionsMenu
              actions={headerActions}
              label={formatMessage({
                id: 'content-manager.containers.edit.header.more-actions',
                defaultMessage: 'More actions',
              })}
            >
              <Information activeTab={status} />
            </DocumentActionsMenu>
          );
        }}
      </DescriptionComponentRenderer>
    </Flex>
  );
};

interface InformationProps {
  activeTab: 'draft' | 'published';
}

const Information = ({ activeTab }: InformationProps) => {
  const { formatMessage } = useIntl();
  const { document, meta } = useDoc();

  if (!document || !document.id) {
    return null;
  }

  /**
   * Because in the backend separate entries are made for draft and published
   * documents, the creator fields are different for each of them. For example,
   * you could make your draft in January and then publish it for the first time
   * in Feb. This would make the createdAt value for the published entry in Feb
   * but really we want to show the document as a whole. The draft entry will also
   * never have the publishedAt values.
   *
   * So, we decipher which document to show the creator for based on the activeTab.
   */

  const createAndUpdateDocument =
    activeTab === 'draft'
      ? document
      : meta?.availableStatus.find((status) => status.publishedAt === null);

  const publishDocument =
    activeTab === 'published'
      ? document
      : meta?.availableStatus.find((status) => status.publishedAt !== null);

  const creator = createAndUpdateDocument?.[CREATED_BY_ATTRIBUTE_NAME]
    ? getDisplayName(createAndUpdateDocument[CREATED_BY_ATTRIBUTE_NAME])
    : null;

  const updator = createAndUpdateDocument?.[UPDATED_BY_ATTRIBUTE_NAME]
    ? getDisplayName(createAndUpdateDocument[UPDATED_BY_ATTRIBUTE_NAME])
    : null;

  const information: Array<{ isDisplayed?: boolean; label: string; value: React.ReactNode }> = [
    {
      isDisplayed: !!publishDocument?.[PUBLISHED_AT_ATTRIBUTE_NAME],
      label: formatMessage({
        id: 'content-manager.containers.edit.information.last-published.label',
        defaultMessage: 'Last published',
      }),
      value: formatMessage(
        {
          id: 'content-manager.containers.edit.information.last-published.value',
          defaultMessage: `Published {time}{isAnonymous, select, true {} other { by {author}}}`,
        },
        {
          time: (
            <RelativeTime timestamp={new Date(publishDocument?.[PUBLISHED_AT_ATTRIBUTE_NAME])} />
          ),
          isAnonymous: !publishDocument?.[PUBLISHED_BY_ATTRIBUTE_NAME],
          author: publishDocument?.[PUBLISHED_BY_ATTRIBUTE_NAME]
            ? getDisplayName(publishDocument?.[PUBLISHED_BY_ATTRIBUTE_NAME])
            : null,
        }
      ),
    },
    {
      isDisplayed: !!createAndUpdateDocument?.[UPDATED_AT_ATTRIBUTE_NAME],
      label: formatMessage({
        id: 'content-manager.containers.edit.information.last-draft.label',
        defaultMessage: 'Last draft',
      }),
      value: formatMessage(
        {
          id: 'content-manager.containers.edit.information.last-draft.value',
          defaultMessage: `Modified {time}{isAnonymous, select, true {} other { by {author}}}`,
        },
        {
          time: (
            <RelativeTime
              timestamp={new Date(createAndUpdateDocument?.[UPDATED_AT_ATTRIBUTE_NAME])}
            />
          ),
          isAnonymous: !updator,
          author: updator,
        }
      ),
    },
    {
      isDisplayed: !!createAndUpdateDocument?.[CREATED_AT_ATTRIBUTE_NAME],
      label: formatMessage({
        id: 'content-manager.containers.edit.information.document.label',
        defaultMessage: 'Document',
      }),
      value: formatMessage(
        {
          id: 'content-manager.containers.edit.information.document.value',
          defaultMessage: `Created {time}{isAnonymous, select, true {} other { by {author}}}`,
        },
        {
          time: (
            <RelativeTime
              timestamp={new Date(createAndUpdateDocument?.[CREATED_AT_ATTRIBUTE_NAME])}
            />
          ),
          isAnonymous: !creator,
          author: creator,
        }
      ),
    },
  ].filter((info) => info.isDisplayed);

  return (
    <Flex
      borderWidth="1px 0 0 0"
      borderStyle="solid"
      borderColor="neutral150"
      direction="column"
      marginTop={2}
      tag="dl"
      padding={5}
      gap={3}
      alignItems="flex-start"
      /**
       * The menu content has a padding of 4px, but we want our divider (the border top applied) to
       * be flush with the menu content. So we need to adjust the margin & width to account for the padding.
       */
      marginLeft="-0.4rem"
      marginRight="-0.4rem"
      width="calc(100% + 8px)"
    >
      {information.map((info) => (
        <Flex gap={1} direction="column" alignItems="flex-start" key={info.label}>
          <Typography tag="dt" variant="pi" fontWeight="bold">
            {info.label}
          </Typography>
          <Typography tag="dd" variant="pi" textColor="neutral600">
            {info.value}
          </Typography>
        </Flex>
      ))}
    </Flex>
  );
};

/* -------------------------------------------------------------------------------------------------
 * HeaderActions
 * -----------------------------------------------------------------------------------------------*/

interface HeaderActionsProps {
  actions: Array<HeaderActionDescription & { id: string }>;
}

const HeaderActions = ({ actions }: HeaderActionsProps) => {
  return (
    <Flex>
      {actions.map((action) => {
        if ('options' in action) {
          return (
            <SingleSelect
              key={action.id}
              size="S"
              disabled={action.disabled}
              aria-label={action.label}
              // @ts-expect-error – the DS will handle numbers, but we're not allowing the API.
              onChange={action.onSelect}
              value={action.value}
            >
              {action.options.map(({ label, ...option }) => (
                <SingleSelectOption key={option.value} {...option}>
                  {label}
                </SingleSelectOption>
              ))}
            </SingleSelect>
          );
        } else {
          // TODO: add button handler
          return null;
        }
      })}
    </Flex>
  );
};

/* -------------------------------------------------------------------------------------------------
 * DocumentActionComponents
 * -----------------------------------------------------------------------------------------------*/

const ConfigureTheViewAction: DocumentActionComponent = ({ collectionType, model }) => {
  const navigate = useNavigate();
  const { formatMessage } = useIntl();

  return {
    label: formatMessage({
      id: 'app.links.configure-view',
      defaultMessage: 'Configure the view',
    }),
    icon: <StyledCog />,
    onClick: () => {
      navigate(`../${collectionType}/${model}/configurations/edit`);
    },
    position: 'header',
  };
};

ConfigureTheViewAction.type = 'configure-the-view';

/**
 * Because the icon system is completely broken, we have to do
 * this to remove the fill from the cog.
 */
const StyledCog = styled(Cog)`
  path {
    fill: currentColor;
  }
`;

const EditTheModelAction: DocumentActionComponent = ({ model }) => {
  const navigate = useNavigate();
  const { formatMessage } = useIntl();

  return {
    label: formatMessage({
      id: 'content-manager.link-to-ctb',
      defaultMessage: 'Edit the model',
    }),
    icon: <StyledPencil />,
    onClick: () => {
      navigate(`/plugins/content-type-builder/content-types/${model}`);
    },
    position: 'header',
  };
};

EditTheModelAction.type = 'edit-the-model';

/**
 * Because the icon system is completely broken, we have to do
 * this to remove the fill from the cog.
 */
const StyledPencil = styled(Pencil)`
  path {
    fill: currentColor;
  }
`;

const DeleteAction: DocumentActionComponent = ({ documentId, model, collectionType, document }) => {
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const listViewPathMatch = useMatch(LIST_PATH);
  const canDelete = useDocumentRBAC('DeleteAction', (state) => state.canDelete);
  const { delete: deleteAction } = useDocumentActions();
  const { toggleNotification } = useNotification();
  const setSubmitting = useForm('DeleteAction', (state) => state.setSubmitting);

  return {
    disabled: !canDelete || !document,
    label: formatMessage({
      id: 'content-manager.actions.delete.label',
      defaultMessage: 'Delete document',
    }),
    icon: <StyledTrash />,
    dialog: {
      type: 'dialog',
      title: formatMessage({
        id: 'app.components.ConfirmDialog.title',
        defaultMessage: 'Confirmation',
      }),
      content: (
        <Flex direction="column" gap={2}>
          <WarningCircle width="24px" height="24px" fill="danger600" />
          <Typography tag="p" variant="omega" textAlign="center">
            {formatMessage({
              id: 'content-manager.actions.delete.dialog.body',
              defaultMessage: 'Are you sure?',
            })}
          </Typography>
        </Flex>
      ),
      onConfirm: async () => {
        /**
         * If we have a match, we're in the list view
         * and therefore not in a form and shouldn't be
         * trying to set the submitting value.
         */
        if (!listViewPathMatch) {
          setSubmitting(true);
        }
        try {
          if (!documentId && collectionType !== SINGLE_TYPES) {
            console.error(
              "You're trying to delete a document without an id, this is likely a bug with Strapi. Please open an issue."
            );

            toggleNotification({
              message: formatMessage({
                id: 'content-manager.actions.delete.error',
                defaultMessage: 'An error occurred while trying to delete the document.',
              }),
              type: 'danger',
            });

            return;
          }

          const res = await deleteAction({
            documentId,
            model,
            collectionType,
            params: {
              locale: '*',
            },
          });

          if (!('error' in res)) {
            navigate({ pathname: `../${collectionType}/${model}` }, { replace: true });
          }
        } finally {
          if (!listViewPathMatch) {
            setSubmitting(false);
          }
        }
      },
    },
    variant: 'danger',
    position: ['header', 'table-row'],
  };
};

DeleteAction.type = 'delete';

/**
 * Because the icon system is completely broken, we have to do
 * this to remove the fill from the cog.
 */
const StyledTrash = styled(Trash)`
  path {
    fill: currentColor;
  }
`;

const DEFAULT_HEADER_ACTIONS = [EditTheModelAction, ConfigureTheViewAction, DeleteAction];

export { Header, DEFAULT_HEADER_ACTIONS };
export type { HeaderProps, HeaderActionDescription };