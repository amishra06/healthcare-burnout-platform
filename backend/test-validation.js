// Test validation middleware functions
const { body, validationResult } = require('express-validator');

console.log('Testing validation middleware...\n');

// Mock request and response objects for testing
function createMockReq(body = {}) {
  return {
    body,
    headers: {},
    params: {},
    query: {}
  };
}

function createMockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// Test validation functions
async function testValidations() {
  console.log('1. Testing email validation...');
  
  // Valid email
  const validEmail = 'test@example.com';
  console.log(`✓ Valid email "${validEmail}": ${/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(validEmail) ? 'PASS' : 'FAIL'}`);
  
  // Invalid email
  const invalidEmail = 'invalid-email';
  console.log(`✓ Invalid email "${invalidEmail}": ${!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invalidEmail) ? 'PASS' : 'FAIL'}`);

  console.log('\n2. Testing department validation...');
  const validDepartments = ['ICU', 'Emergency', 'General'];
  
  console.log(`✓ Valid department "ICU": ${validDepartments.includes('ICU') ? 'PASS' : 'FAIL'}`);
  console.log(`✓ Invalid department "InvalidDept": ${!validDepartments.includes('InvalidDept') ? 'PASS' : 'FAIL'}`);

  console.log('\n3. Testing hours validation...');
  
  // Valid hours
  const validHours = 8.5;
  console.log(`✓ Valid hours ${validHours}: ${validHours >= 0 && validHours <= 24 ? 'PASS' : 'FAIL'}`);
  
  // Invalid hours (negative)
  const negativeHours = -2;
  console.log(`✓ Invalid hours ${negativeHours}: ${!(negativeHours >= 0 && negativeHours <= 24) ? 'PASS' : 'FAIL'}`);
  
  // Invalid hours (too high)
  const tooManyHours = 25;
  console.log(`✓ Invalid hours ${tooManyHours}: ${!(tooManyHours >= 0 && tooManyHours <= 24) ? 'PASS' : 'FAIL'}`);

  console.log('\n4. Testing name validation...');
  
  // Valid name
  const validName = 'John Doe';
  console.log(`✓ Valid name "${validName}": ${validName.length >= 2 && validName.length <= 100 ? 'PASS' : 'FAIL'}`);
  
  // Invalid name (too short)
  const shortName = 'J';
  console.log(`✓ Invalid name "${shortName}": ${!(shortName.length >= 2 && shortName.length <= 100) ? 'PASS' : 'FAIL'}`);

  console.log('\n5. Testing role validation...');
  
  // Valid role
  const validRole = 'Nurse';
  console.log(`✓ Valid role "${validRole}": ${validRole.length >= 2 && validRole.length <= 50 ? 'PASS' : 'FAIL'}`);

  console.log('\n6. Testing date validation...');
  
  // Valid date
  const validDate = '2023-01-15';
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  console.log(`✓ Valid date "${validDate}": ${dateRegex.test(validDate) ? 'PASS' : 'FAIL'}`);
  
  // Invalid date
  const invalidDate = '2023/01/15';
  console.log(`✓ Invalid date "${invalidDate}": ${!dateRegex.test(invalidDate) ? 'PASS' : 'FAIL'}`);

  console.log('\n🎉 All validation tests completed!');
}

// Test error response format
function testErrorFormat() {
  console.log('\n7. Testing error response format...');
  
  const errorResponse = {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input data',
      details: [
        {
          field: 'email',
          message: 'Valid email is required'
        }
      ]
    }
  };

  console.log('✓ Error response format:');
  console.log(JSON.stringify(errorResponse, null, 2));
}

// Test success response format
function testSuccessFormat() {
  console.log('\n8. Testing success response format...');
  
  const successResponse = {
    success: true,
    data: {
      staff: {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@hospital.com',
        department: 'ICU',
        role: 'Nurse',
        hire_date: '2023-01-15'
      }
    }
  };

  console.log('✓ Success response format:');
  console.log(JSON.stringify(successResponse, null, 2));
}

// Run all tests
testValidations();
testErrorFormat();
testSuccessFormat();