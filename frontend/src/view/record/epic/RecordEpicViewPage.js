import React, { Component } from 'react';
import { Card, Col, Row, Collapse, Divider } from 'antd';
import ContentWrapper from 'view/layout/styles/ContentWrapper';
import Breadcrumb from 'view/shared/Breadcrumb';
import { i18n } from 'i18n';
import { connect } from 'react-redux';
import actions from 'modules/epic/view/epicViewActions';
import selectors from 'modules/epic/view/epicViewSelectors';
import _get from 'lodash/get';
import RecordEpicView from 'view/record/epic/RecordEpicView';
import { CaretRightOutlined } from '@ant-design/icons';
import styled from 'styled-components';
const { Panel } = Collapse;

const CollapseWrapper = styled.div `
  .ant-collapse-header {
    display: flex;
    background-color: #FFF;
    padding: 12px !important;

    .ant-collapse-arrow {
      margin-right: 10px;
      align-self: center;
    }
  }
`;


const PanelHeader = styled.div`
  flex: 1;
`;

const enumeratorLabel = (name) => i18n(`entities.evaluationCriteria.enumerators.operators.${name}`);

class RecordEpicPage extends Component {
  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(actions.doFind(match.params.id));
  }

  get fieldsParser() {
    return ({
      totalreadtime: 'Read time',
    })
  }

  componentWillUnmount() {
    this.props.dispatch(actions.doStartDocumentCount(this.props.match.params.id, []));
  }

  renderElement = (item) => {
    if (!item) {
      return null;
    }

    const criteria = _get(item, 'criteria', {});
    const status = criteria.done ? 'Completed' : 'Uncompleted'

    return (
      <Panel
        key={JSON.stringify({
          id: criteria.id,
          type: item.__typename
        })}
        header={(
          <PanelHeader>
            <Row>
              <Col xs={12}>
                {item.__typename}:
                &nbsp;
                <strong>
                  Read time
                </strong>
                &nbsp;
                {enumeratorLabel(criteria.operator)} {criteria.evaluation}
              </Col>
              <Col xs={12} style={{ textAlign: 'right' }}>
                {status}
              </Col>
            </Row>
          </PanelHeader>
        )}
      >
        <Row>
          <Col xs={24}>
            <Divider>
              <strong>
                Total Read:
              </strong>
              &nbsp;
              {criteria.total || '0'}
            </Divider>
            <div
              dangerouslySetInnerHTML={{ __html: item.contentHTML }}
            />
          </Col>
        </Row>
      </Panel>
    )
  }

  onChange = (elements) => {
    const items = elements.map(item => JSON.parse(item));
    const documents = items.filter(item => item.type === 'Document').map(({ id }) => id)

    this.props.dispatch(
      actions.doStartDocumentCount(this.props.match.params.id, documents)
    );
  };

  render() {
    const { epic, loading } = this.props;
    const evaluations =  _get(epic, 'evaluations', []).reduce((obj, item) => ({
      ...obj,
      [item.id]: item
    }), {});
    const elements = _get(epic, 'host.elements', []).map((element) => ({
      ...element,
      criteria: evaluations[element.id]
    }));
    const moduleName = _get(epic, 'roadmap.host.name');
    const casedName = _get(epic, 'roadmap.record.host.name');

    return (
      <React.Fragment>
        <Breadcrumb
          items={[
            [i18n('home.menu'), '/'],
            [i18n('entities.record.menu'), '/record'],
            !!casedName && [casedName, `/record/${_get(epic, 'roadmap.record.id')}`],
            !!moduleName && [moduleName, `/roadmaps/${_get(epic, 'roadmap.id')}`],
            [i18n('entities.record.task.title')],
          ].filter(i => i)}
        />
        <ContentWrapper>
          <RecordEpicView
            epic={epic}
            loading={loading}
          />
          <Card
            title="Task Types"
          >
            <CollapseWrapper>
              <Collapse
                onChange={this.onChange}
                expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
              >
                {elements.map(this.renderElement)}
              </Collapse>
            </CollapseWrapper>
          </Card>
        </ContentWrapper>
      </React.Fragment>
    )
  }
}

const select = (state) => ({
  epic: selectors.selectRecord(state),
  loading: selectors.selectLoading(state),
})

export default connect(select)(RecordEpicPage);
