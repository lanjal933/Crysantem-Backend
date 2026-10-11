require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUpdate() {
  console.log('=== PRUEBA DE ACTUALIZACIÓN DE INTEGRACIONES ===');
  
  const testData = {
    sheets: {
      dbId: 'TEST_ID_123',
      additional: '',
      writeUsers: true,
      writeAdditional: false
    },
    drive: {
      folderId: 'TEST_FOLDER_456',
      additionalFolders: ''
    },
    gmail: {
      sender: 'test@test.com',
      replyTo: '',
      subject: 'Test',
      template: '',
      sendType: 'immediate',
      aiSubject: true,
      aiBody: true,
      aiAttachments: false
    },
    calendar: {
      id: 'primary',
      duration: 30,
      timezone: 'UTC',
      schedules: {
        Mon: { enabled: true, start: '09:00', end: '18:00' }
      }
    }
  };
  
  console.log('Intentando actualizar registro ff17c610-0e81-436e-b195-0e772b695e0a...');
  
  const { data, error } = await supabase
    .from('myia_page_config')
    .update({
      integrations_config: testData,
      payment_plan: 'responde',
      payment_method: 'card',
      google_connected: true
    })
    .eq('id', 'ff17c610-0e81-436e-b195-0e772b695e0a')
    .select()
    .single();
  
  if (error) {
    console.log('=== ERROR EN ACTUALIZACIÓN ===');
    console.log('Error:', error);
    console.log('Message:', error.message);
    console.log('Code:', error.code);
    console.log('Details:', error.details);
    console.log('Hint:', error.hint);
  } else {
    console.log('=== ACTUALIZACIÓN EXITOSA ===');
    console.log('Datos actualizados:', data);
    console.log('integrations_config:', data.integrations_config);
    console.log('payment_plan:', data.payment_plan);
    console.log('payment_method:', data.payment_method);
    console.log('google_connected:', data.google_connected);
  }
}

testUpdate();
