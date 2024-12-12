import { Box, IconButton, Status, Table, Tbody, Td, Tr, Typography } from '@strapi/design-system';
import { CheckCircle, Pencil } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { Link, useNavigate } from 'react-router-dom';
import { styled } from 'styled-components';

import { RelativeTime } from '../../../components/RelativeTime';
import { useTracking } from '../../../features/Tracking';
import { useGetRecentDocumentsQuery } from '../../../services/homepage';
import { capitalise } from '../../../utils/strings';

import { Widget } from './Widget';

import type { RecentDocument } from '../../../../../shared/contracts/homepage';

const getEditViewLink = (document: RecentDocument): string => {
  // TODO: import the constants for this once the code is moved to the CM package
  const kindPath = document.kind === 'singleType' ? 'single-types' : 'collection-types';

  return `/content-manager/${kindPath}/${document.contentTypeUid}/${document.documentId}`;
};

const CellTypography = styled(Typography).attrs({ maxWidth: '14.4rem', display: 'inline-block' })`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

interface DocumentStatusProps {
  status: RecentDocument['status'];
}

const DocumentStatus = ({ status = 'draft' }: DocumentStatusProps) => {
  const statusVariant =
    status === 'draft' ? 'secondary' : status === 'published' ? 'success' : 'alternative';

  const { formatMessage } = useIntl();

  return (
    <Status variant={statusVariant} size="XS">
      <Typography tag="span" variant="omega" fontWeight="bold">
        {formatMessage({
          id: `content-manager.containers.List.${status}`,
          defaultMessage: capitalise(status),
        })}
      </Typography>
    </Status>
  );
};

const WidgetContent = ({ document }: { document: RecentDocument }) => {
  const { formatMessage } = useIntl();
  const { trackUsage } = useTracking();
  const navigate = useNavigate();

  const handleRowClick = (document: RecentDocument) => () => {
    trackUsage('willEditEntryFromHome');
    const link = getEditViewLink(document);
    navigate(link);
  };

  return (
    <Tr onClick={handleRowClick(document)} key={document.documentId}>
      <Td>
        <CellTypography title={document.title} variant="omega" textColor="neutral800">
          {document.title}
        </CellTypography>
      </Td>
      <Td>
        <CellTypography variant="omega" textColor="neutral600">
          {document.kind === 'singleType'
            ? formatMessage({
                id: 'content-manager.widget.last-edited.single-type',
                defaultMessage: 'Single-Type',
              })
            : formatMessage({
                id: document.contentTypeDisplayName,
                defaultMessage: document.contentTypeDisplayName,
              })}
        </CellTypography>
      </Td>
      <Td>
        <Box display="inline-block">
          <DocumentStatus status={document.status} />
        </Box>
      </Td>
      <Td>
        <Typography textColor="neutral600">
          <RelativeTime timestamp={new Date(document.updatedAt)} />
        </Typography>
      </Td>
      <Td onClick={(e) => e.stopPropagation()}>
        <Box display="inline-block">
          <IconButton
            tag={Link}
            to={getEditViewLink(document)}
            onClick={() => trackUsage('willEditEntryFromHome')}
            label={formatMessage({
              id: 'content-manager.actions.edit.label',
              defaultMessage: 'Edit',
            })}
            variant="ghost"
          >
            <Pencil />
          </IconButton>
        </Box>
      </Td>
    </Tr>
  );
};

/* -------------------------------------------------------------------------------------------------
 * LastEditedWidget
 * -----------------------------------------------------------------------------------------------*/

const LastEditedWidget = () => {
  const { formatMessage } = useIntl();
  const { data, isLoading, error } = useGetRecentDocumentsQuery({ action: 'update' });

  if (isLoading) {
    return <Widget.Loading />;
  }

  if (error) {
    return <Widget.Error />;
  }

  if (data?.length === 0) {
    return (
      <Widget.NoData>
        {formatMessage({
          id: 'content-manager.widget.last-edited.no-data',
          defaultMessage: 'No edited entries',
        })}
      </Widget.NoData>
    );
  }

  return (
    <Widget.Root
      title={{
        id: 'content-manager.widget.last-edited.title',
        defaultMessage: 'Last edited entries',
      }}
      icon={Pencil}
    >
      <Table colCount={5} rowCount={data?.length ?? 0}>
        <Tbody>
          {data?.map((document) => <WidgetContent key={document.documentId} document={document} />)}
        </Tbody>
      </Table>
    </Widget.Root>
  );
};

/* -------------------------------------------------------------------------------------------------
 * LastPublishedWidget
 * -----------------------------------------------------------------------------------------------*/

const LastPublishedWidget = () => {
  const { formatMessage } = useIntl();
  const { data, isLoading, error } = useGetRecentDocumentsQuery({ action: 'publish' });

  if (isLoading) {
    return <Widget.Loading />;
  }

  if (error) {
    return <Widget.Error />;
  }

  if (data?.length === 0) {
    return (
      <Widget.NoData>
        {formatMessage({
          id: 'content-manager.widget.last-published.no-data',
          defaultMessage: 'No published entries',
        })}
      </Widget.NoData>
    );
  }

  return (
    <Widget.Root
      title={{
        id: 'content-manager.widget.last-published.title',
        defaultMessage: 'Last published entries',
      }}
      icon={CheckCircle}
    >
      <Table colCount={5} rowCount={data?.length ?? 0}>
        <Tbody>
          {data?.map((document) => <WidgetContent key={document.documentId} document={document} />)}
        </Tbody>
      </Table>
    </Widget.Root>
  );
};

export { LastEditedWidget, LastPublishedWidget };