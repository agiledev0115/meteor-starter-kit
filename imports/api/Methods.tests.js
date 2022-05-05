import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { mockMethodCall } from 'meteor/quave:testing';
import { assert } from 'chai';
import { DocumentsCollection } from '/imports/db/DocumentsCollection';
import '/imports/api/Methods';

if (Meteor.isServer) {
  describe('Devices', () => {
    describe('methods', () => {
      const userId = Random.id();
      let deviceId;

      beforeEach(() => {
        DocumentsCollection.remove({});
        deviceId = DocumentsCollection.insert({
          mac: 'unique_id',
          name: 'first mac name',
          createdAt: new Date(),
          userId,
        });
      });

      it('can delete owned device', () => {
        mockMethodCall('devices.remove', deviceId, { context: { userId } });

        assert.equal(DocumentsCollection.find().count(), 0);
      });

      it('can\'t delete device without an user authenticated', () => {
        const fn = () => mockMethodCall('devices.remove', deviceId);
        assert.throw(fn, /Not authorized/);
        assert.equal(DocumentsCollection.find().count(), 1);
      });

      it('can\'t delete device from another owner', () => {
        const fn = () =>
          mockMethodCall('devices.remove', deviceId, {
            context: { userId: 'somebody-else-id' },
          });
        assert.throw(fn, /Access denied/);
        assert.equal(DocumentsCollection.find().count(), 1);
      });

      it('can change the status of a device', () => {
        const originalDevice = DocumentsCollection.findOne(deviceId);
        mockMethodCall('devices.setIsChecked', deviceId, !originalDevice.isChecked, {
          context: { userId },
        });

        const updatedDevice = DocumentsCollection.findOne(deviceId);
        assert.notEqual(updatedDevice.isChecked, originalDevice.isChecked);
      });

      it('can insert new devices', () => {
        const mac = 'new_unique_mac_id';
        DocumentsCollection.save({ mac, name, userId });

        const devices = DocumentsCollection.find({}).fetch();
        assert.equal(devices.length, 2);
        assert.isTrue(devices.some(device => device.mac === mac));
      });
    });
  });
}
