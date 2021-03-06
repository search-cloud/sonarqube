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
import { saveAll } from '../../helpers/storage';

const routes = [
  {
    getComponent(_, callback) {
      import('./components/App').then(i => callback(null, i.default));
    },
    childRoutes: [
      {
        getIndexRoute(_, callback) {
          import('./components/DefaultPageSelector').then(i =>
            callback(null, { component: i.default })
          );
        }
      },
      {
        path: 'all',
        onEnter(_, replace) {
          saveAll();
          replace('/projects');
        }
      },
      {
        path: 'favorite',
        getComponent(_, callback) {
          import('./components/FavoriteProjectsContainer').then(i => callback(null, i.default));
        }
      }
    ]
  }
];

export default routes;
