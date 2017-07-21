/*
 * SonarQube
 * Copyright (C) 2009-2017 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
import React, { Component } from 'react';
import Helmet from 'react-helmet';
import ListHeader from './ListHeader';
import List from './List';
import {
  fetchQualityGatesAppDetails,
  fetchQualityGates as fetchQualityGatesAPI
} from '../../../api/quality-gates';
import { translate } from '../../../helpers/l10n';
import { getQualityGateUrl } from '../../../helpers/urls';
import '../styles.css';

export default class QualityGatesApp extends Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  state = {};

  componentDidMount() {
    this.fetchQualityGates();
  }

  fetchQualityGates() {
    Promise.all([fetchQualityGatesAppDetails(), fetchQualityGatesAPI()]).then(responses => {
      const [details, qualityGates] = responses;
      const { updateStore } = this.props;

      updateStore({ ...details, qualityGates });
    });
  }

  handleAdd(qualityGate) {
    const { addQualityGate, organization } = this.props;
    const { router } = this.context;

    addQualityGate(qualityGate);
    router.push(getQualityGateUrl(qualityGate.id, organization && organization.key));
  }

  render() {
    const { children, qualityGates, edit, organization } = this.props;
    const defaultTitle = translate('quality_gates.page');
    const top = organization ? 95 : 30;
    return (
      <div className="search-navigator sticky search-navigator-extended-view">
        <Helmet defaultTitle={defaultTitle} titleTemplate={'%s - ' + defaultTitle} />

        <div className="search-navigator-side search-navigator-side-light" style={{ top }}>
          <div className="search-navigator-filters">
            <ListHeader canEdit={edit} onAdd={this.handleAdd.bind(this)} />
          </div>
          <div className="quality-gates-results panel">
            {qualityGates != null &&
              <List organization={organization} qualityGates={qualityGates} />}
          </div>
        </div>

        {qualityGates != null &&
          React.Children.map(children, child => React.cloneElement(child, { organization }))}
      </div>
    );
  }
}
