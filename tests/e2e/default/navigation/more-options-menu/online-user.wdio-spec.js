const commonPage = require('../../../../page-objects/default/common/common.wdio.page');
const loginPage = require('../../../../page-objects/default/login/login.wdio.page');
const contactPage = require('../../../../page-objects/default/contacts/contacts.wdio.page');
const reportPage = require('../../../../page-objects/default/reports/reports.wdio.page');
const placeFactory = require('../../../../factories/cht/contacts/place');
const reportFactory = require('../../../../factories/cht/reports/generic-report');
const personFactory = require('../../../../factories/cht/contacts/person');
const uuid = require('uuid').v4;
const utils = require('../../../../utils');

const places = placeFactory.generateHierarchy();
const clinic = places.get('clinic');
const health_center = places.get('health_center');
const district_hospital = places.get('district_hospital');

const contact = personFactory.build({
  _id: uuid(),
  name: 'contact',
  phone: '+12068881234',
  place: health_center._id,
  type: 'person',
  parent: {
    _id: health_center._id,
    parent: health_center.parent
  },
});

const patient = personFactory.build({
  _id: uuid(),
  parent: { _id: clinic._id, parent: { _id: health_center._id, parent: { _id: district_hospital._id }}}
});

const report = reportFactory.build({ form: 'home_visit', content_type: 'xml' }, { patient, submitter: contact });

const sendMessage = async (message = 'Testing', phone = contact.phone) => {
  await utils.request({
    method: 'POST',
    path: '/api/v2/records',
    headers: {
      'Content-type': 'application/x-www-form-urlencoded'
    },
    body:`message=${message}&from=${phone}`,
  });  
};

describe('Online User', async () => {  
  before(async () => {
    await loginPage.cookieLogin();
  });
  describe('Options disabled when no items: messages, contacts, people', async () => {
    it('- Message tab', async () => {
      await commonPage.goToMessages();
      await commonPage.openMoreOptionsMenu();
      expect(await commonPage.isOptionEnabled('export', 'messages')).to.be.false;    
    });

    it(' - Contact tab', async () => {
      await commonPage.goToPeople();
      await commonPage.openMoreOptionsMenu();
      expect(await commonPage.isOptionEnabled('export', 'contacts')).to.be.false;
      expect(await commonPage.isOptionVisible('edit', 'contacts')).to.be.false;
      expect(await commonPage.isOptionVisible('delete', 'contacts')).to.be.false;     
    });

    it('- Report tab', async () => {
      await commonPage.goToReports();
      await commonPage.openMoreOptionsMenu();
      expect(await commonPage.isOptionEnabled('export', 'reports')).to.be.false;
      expect(await commonPage.isOptionVisible('edit', 'reports')).to.be.false;
      expect(await commonPage.isOptionVisible('delete', 'reports')).to.be.false;     
    });
  });

  describe(' - Options enabled when there are items: messages, contacts, peope', async () => {
    before(async () => {
      await utils.saveDocs([ ...places.values(), contact, patient, report ]);
      await sendMessage();    
    });

    it('- Contact tab: no contact selected', async () => {
      await commonPage.goToPeople();
      await commonPage.openMoreOptionsMenu();
      expect(await commonPage.isOptionEnabled('export', 'contacts')).to.be.true;
      expect(await commonPage.isOptionVisible('edit', 'contacts')).to.be.false;
      expect(await commonPage.isOptionVisible('delete', 'contacts')).to.be.false;
    });

    it(' - Contact Tab : contact selected', async () => {
      await commonPage.goToPeople();
      await contactPage.selectLHSRowByText(contact.name);
      await (await contactPage.contentRow()).waitForDisplayed();
      await (await contactPage.contentRow()).click();
      await contactPage.waitForContactLoaded();
      await commonPage.openMoreOptionsMenu();
      expect(await commonPage.isOptionEnabled('export', 'contacts')).to.be.true;
      expect(await commonPage.isOptionEnabled('edit', 'contacts')).to.be.true;
      expect(await commonPage.isOptionEnabled('delete', 'contacts')).to.be.true;
    });

    it('- options enabled when report selected', async () => {
      await commonPage.goToReports();
      (await reportPage.firstReport()).click();
      await reportPage.reportBodyDetails().waitForDisplayed();      
      await commonPage.openMoreOptionsMenu();
      expect(await commonPage.isOptionEnabled('export', 'reports')).to.be.true;
      expect(await commonPage.isOptionEnabled('edit', 'reports')).to.be.true; // xml report
      expect(await commonPage.isOptionEnabled('delete', 'reports')).to.be.true;     
    });

    it('- Message tab', async () => {
      await commonPage.goToMessages();
      await commonPage.waitForLoaderToDisappear();
      await commonPage.openMoreOptionsMenu();
      expect(await commonPage.isOptionEnabled('export', 'messages')).to.be.true;    
    });
  });
});


