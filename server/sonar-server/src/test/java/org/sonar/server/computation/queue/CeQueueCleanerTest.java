/*
 * SonarQube
 * Copyright (C) 2009-2016 SonarSource SA
 * mailto:contact AT sonarsource DOT com
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
package org.sonar.server.computation.queue;

import java.io.IOException;
import java.util.Optional;
import org.apache.commons.io.IOUtils;
import org.junit.Rule;
import org.junit.Test;
import org.sonar.api.platform.ServerUpgradeStatus;
import org.sonar.api.utils.System2;
import org.sonar.db.DbTester;
import org.sonar.db.ce.CeQueueDto;
import org.sonar.db.ce.CeTaskDataDao;
import org.sonar.db.ce.CeTaskTypes;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class CeQueueCleanerTest {

  @Rule
  public DbTester dbTester = DbTester.create(System2.INSTANCE);

  private ServerUpgradeStatus serverUpgradeStatus = mock(ServerUpgradeStatus.class);
  private InternalCeQueue queue = mock(InternalCeQueue.class);
  private CeQueueCleaner underTest = new CeQueueCleaner(dbTester.getDbClient(), serverUpgradeStatus, queue);

  @Test
  public void reset_in_progress_tasks_to_pending() throws IOException {
    insertInQueue("TASK_1", CeQueueDto.Status.PENDING);
    insertInQueue("TASK_2", CeQueueDto.Status.IN_PROGRESS);

    underTest.clean(dbTester.getSession());

    assertThat(dbTester.getDbClient().ceQueueDao().countByStatus(dbTester.getSession(), CeQueueDto.Status.PENDING)).isEqualTo(2);
    assertThat(dbTester.getDbClient().ceQueueDao().countByStatus(dbTester.getSession(), CeQueueDto.Status.IN_PROGRESS)).isEqualTo(0);
  }

  @Test
  public void clear_queue_if_version_upgrade() {
    when(serverUpgradeStatus.isUpgraded()).thenReturn(true);

    underTest.clean(dbTester.getSession());

    verify(queue).clear();
  }

  @Test
  public void delete_orphan_report_files() throws Exception {
    // analysis reports are persisted but the associated
    // task is not in the queue
    insertInQueue("TASK_1", CeQueueDto.Status.PENDING);
    insertTaskData("TASK_1");
    insertTaskData("TASK_2");

    underTest.clean(dbTester.getSession());

    CeTaskDataDao dataDao = dbTester.getDbClient().ceTaskDataDao();
    Optional<CeTaskDataDao.DataStream> task1Data = dataDao.selectData(dbTester.getSession(), "TASK_1");
    assertThat(task1Data).isPresent();
    task1Data.get().close();

    assertThat(dataDao.selectData(dbTester.getSession(), "TASK_2")).isNotPresent();
  }

  private CeQueueDto insertInQueue(String taskUuid, CeQueueDto.Status status) throws IOException {
    CeQueueDto dto = new CeQueueDto();
    dto.setTaskType(CeTaskTypes.REPORT);
    dto.setComponentUuid("PROJECT_1");
    dto.setUuid(taskUuid);
    dto.setStatus(status);
    dbTester.getDbClient().ceQueueDao().insert(dbTester.getSession(), dto);
    dbTester.getSession().commit();
    return dto;
  }

  private void insertTaskData(String taskUuid) throws IOException {
    dbTester.getDbClient().ceTaskDataDao().insert(dbTester.getSession(), taskUuid, IOUtils.toInputStream("{binary}"));
    dbTester.getSession().commit();
  }
}
