import test from 'node:test';

const formData = new FormData();
formData.append('name', 'John Doe');
formData.append('email', 'john@example.com');
formData.append('job_id', '1234');
// A standard publicly available PDF
formData.append('resume_url', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');

console.log('Sending FormData...');

fetch('http://127.0.0.1:5001/api/v1/resume/parse', {
  method: 'POST',
  body: formData
})
.then(res => res.json().then(data => ({status: res.status, data})))
.then(console.log)
.catch(console.error);
