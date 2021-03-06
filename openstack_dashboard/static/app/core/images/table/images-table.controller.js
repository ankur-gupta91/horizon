/**
 * (c) Copyright 2015 Hewlett-Packard Development Company, L.P.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may obtain
 * a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */

(function() {
  'use strict';

  /**
   * @ngdoc controller
   * @name ImagesTableController
   *
   * @description
   * Controller for the images table.
   * Serves as the focal point for table actions.
   */
  angular
    .module('horizon.app.core.images')
    .controller('imagesTableController', ImagesTableController);

  ImagesTableController.$inject = [
    '$q',
    '$scope',
    'horizon.app.core.images.batch-actions.service',
    'horizon.app.core.images.row-actions.service',
    'horizon.app.core.images.events',
    'horizon.app.core.openstack-service-api.glance',
    'horizon.app.core.openstack-service-api.userSession',
    'imageVisibilityFilter'
  ];

  function ImagesTableController(
    $q,
    $scope,
    batchActions,
    rowActions,
    events,
    glance,
    userSession,
    imageVisibilityFilter
  ) {
    var ctrl = this;

    ctrl.checked = {};

    ctrl.images = [];
    ctrl.imagesSrc = [];

    ctrl.batchActions = batchActions;
    ctrl.batchActions.initScope($scope);

    ctrl.rowActions = rowActions;
    ctrl.rowActions.initScope($scope);

    var deleteWatcher = $scope.$on(events.DELETE_SUCCESS, onDeleteSuccess);

    $scope.$on('$destroy', destroy);

    init();

    ////////////////////////////////

    function init() {
      $q.all(
        {
          images: glance.getImages(),
          session: userSession.get()
        }
      ).then(onInitialized);
    }

    function onInitialized(d) {
      ctrl.imagesSrc.length = 0;
      angular.forEach(d.images.data.items, function itemFilter (image) {
        //This sets up data expected by the table for display or sorting.
        image.filtered_visibility = imageVisibilityFilter(image, d.session.project_id);
        ctrl.imagesSrc.push(image);
      });
    }

    function onDeleteSuccess(e, removedImageIds) {
      ctrl.imagesSrc = difference(ctrl.imagesSrc, removedImageIds, 'id');

      /* eslint-disable angular/controller-as */
      $scope.selected = {};
      $scope.numSelected = 0;
      /* eslint-enable angular/controller-as */

      e.stopPropagation();
    }

    function difference(currentList, otherList, key) {
      return currentList.filter(filter);

      function filter(elem) {
        return otherList.filter(function filterDeletedItem(deletedItem) {
          return deletedItem === elem[key];
        }).length === 0;
      }
    }

    function destroy() {
      deleteWatcher();
    }

  }

})();
