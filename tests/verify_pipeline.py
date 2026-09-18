import urllib.request
import json
import os

boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'

def post_multipart(url, fields, files):
    body = bytearray()
    for k, v in fields.items():
        body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    for k, (fname, fcontent) in files.items():
        body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"; filename="{fname}"\r\nContent-Type: image/png\r\n\r\n'.encode())
        body.extend(fcontent)
        body.extend(b'\r\n')
    body.extend(f'--{boundary}--\r\n'.encode())
    req = urllib.request.Request(url, data=bytes(body), headers={'Content-Type': f'multipart/form-data; boundary={boundary}'})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def post_json(url, data):
    req = urllib.request.Request(url, data=json.dumps(data).encode(), headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

# 1. Project
proj = post_json('http://127.0.0.1:8000/api/v1/projects/', {'name': 'E2E Verification Project'})
proj_id = proj['id']
print('1. Project created:', proj_id)

# 2. Upload
with open('test_screen.png', 'rb') as f:
    img_content = f.read()
img_res = post_multipart('http://127.0.0.1:8000/api/v1/upload/', {'project_id': str(proj_id)}, {'file': ('test_screen.png', img_content)})
img_id = img_res['id']
print('2. Image uploaded, ID:', img_id)

# 3. Preprocess
prep = post_multipart('http://127.0.0.1:8000/api/v1/preprocess', {'project_id': str(proj_id), 'image_id': str(img_id)}, {})
print('3. Preprocessed:', prep.get('message'))

# 4. Segment
seg = post_multipart('http://127.0.0.1:8000/api/v1/segment', {'project_id': str(proj_id), 'image_id': str(img_id)}, {})
print('4. Segmented:', seg.get('label'))

# 5. Depth
depth = post_multipart('http://127.0.0.1:8000/api/v1/depth/estimate', {'project_id': str(proj_id), 'image_id': str(img_id)}, {})
depth_id = depth['id']
print('5. Depth estimated, ID:', depth_id, 'model:', depth.get('model_used'))

# 6. Calibrate
calib = post_json('http://127.0.0.1:8000/api/v1/calibrate/', {'project_id': proj_id})
print('6. Calibrated, scale factor:', calib.get('scale_factor'))

# 7. Height
height = post_multipart('http://127.0.0.1:8000/api/v1/height/estimate', {'project_id': str(proj_id), 'depth_result_id': str(depth_id)}, {})
print('7. Heights estimated, max height:', height.get('max_height'), 'buildings:', height.get('num_buildings'))

# 8. Point cloud
pc = post_multipart('http://127.0.0.1:8000/api/v1/reconstruct/pointcloud', {'project_id': str(proj_id), 'depth_result_id': str(depth_id)}, {})
print('8. Point cloud generated, points:', pc.get('num_points'))

# 9. Mesh
mesh = post_multipart('http://127.0.0.1:8000/api/v1/reconstruct/mesh', {'project_id': str(proj_id), 'depth_result_id': str(depth_id)}, {})
print('9. Mesh generated, faces:', mesh.get('num_faces'))

# 10. Flythrough path
fly = post_multipart('http://127.0.0.1:8000/api/v1/flythrough/path', {'project_id': str(proj_id), 'reconstruction_id': str(pc.get('id', 0))}, {})
print('10. Flythrough path generated, keyframes:', len(fly.get('path', [])))

# 11. Report
req = urllib.request.Request(f'http://127.0.0.1:8000/api/v1/reports/{proj_id}')
with urllib.request.urlopen(req) as resp:
    rep = json.loads(resp.read().decode())
print('11. Report retrieved successfully! Project name:', rep['report_data']['project_name'])
print('\nALL 11 STAGES COMPLETED 100% SUCCESSFULLY!')
