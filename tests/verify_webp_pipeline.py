import urllib.request
import urllib.parse
import json
import io
from PIL import Image

def multipart_encode(fields, files):
    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    body = bytearray()
    for name, value in fields.items():
        body.extend(f'--{boundary}\r\n'.encode('utf-8'))
        body.extend(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode('utf-8'))
        body.extend(f'{value}\r\n'.encode('utf-8'))
    for name, (filename, content, mime) in files.items():
        body.extend(f'--{boundary}\r\n'.encode('utf-8'))
        body.extend(f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'.encode('utf-8'))
        body.extend(f'Content-Type: {mime}\r\n\r\n'.encode('utf-8'))
        body.extend(content)
        body.extend(b'\r\n')
    body.extend(f'--{boundary}--\r\n'.encode('utf-8'))
    return boundary, bytes(body)

def main():
    BASE_URL = 'http://127.0.0.1:8000/api/v1'

    # 1. Create a test webp image
    img = Image.new('RGB', (256, 256), color=(70, 130, 180))
    buf = io.BytesIO()
    img.save(buf, format='WEBP')
    webp_bytes = buf.getvalue()

    # 2. Test create project
    req = urllib.request.Request(
        f'{BASE_URL}/projects/',
        data=json.dumps({'name': '26nepal-flood-satellite-images1.webp', 'description': 'WebP test'}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        proj = json.loads(resp.read().decode('utf-8'))
        print('1. Create Project:', resp.status, 'project_id =', proj['id'])
        project_id = proj['id']

    # 3. Test upload webp
    boundary, body = multipart_encode({'project_id': str(project_id)}, {'file': ('26nepal-flood-satellite-images1.webp', webp_bytes, 'image/webp')})
    req = urllib.request.Request(
        f'{BASE_URL}/upload/',
        data=body,
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
    )
    with urllib.request.urlopen(req) as resp:
        img_res = json.loads(resp.read().decode('utf-8'))
        print('2. Upload WebP:', resp.status, 'image_id =', img_res['id'], 'filename =', img_res['filename'])
        image_id = img_res['id']

    # 4. Test preprocess
    boundary, body = multipart_encode({'project_id': str(project_id), 'image_id': str(image_id)}, {})
    req = urllib.request.Request(f'{BASE_URL}/preprocess', data=body, headers={'Content-Type': f'multipart/form-data; boundary={boundary}'})
    with urllib.request.urlopen(req) as resp:
        print('3. Preprocess:', resp.status)

    # 5. Test segment
    req = urllib.request.Request(f'{BASE_URL}/segment', data=body, headers={'Content-Type': f'multipart/form-data; boundary={boundary}'})
    with urllib.request.urlopen(req) as resp:
        print('4. Segment:', resp.status)

    # 6. Test depth
    req = urllib.request.Request(f'{BASE_URL}/depth/estimate', data=body, headers={'Content-Type': f'multipart/form-data; boundary={boundary}'})
    with urllib.request.urlopen(req) as resp:
        depth_res = json.loads(resp.read().decode('utf-8'))
        print('5. Depth Estimate:', resp.status, 'depth_id =', depth_res['id'])
        depth_id = depth_res['id']

    # 7. Test calibrate
    req = urllib.request.Request(f'{BASE_URL}/calibrate/', data=json.dumps({'project_id': project_id}).encode('utf-8'), headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        print('6. Calibrate:', resp.status)

    # 8. Test height
    boundary, body = multipart_encode({'project_id': str(project_id), 'depth_result_id': str(depth_id)}, {})
    req = urllib.request.Request(f'{BASE_URL}/height/estimate', data=body, headers={'Content-Type': f'multipart/form-data; boundary={boundary}'})
    with urllib.request.urlopen(req) as resp:
        print('7. Height Estimate:', resp.status)

    # 9. Test point cloud
    req = urllib.request.Request(f'{BASE_URL}/reconstruct/pointcloud', data=body, headers={'Content-Type': f'multipart/form-data; boundary={boundary}'})
    with urllib.request.urlopen(req) as resp:
        pc_res = json.loads(resp.read().decode('utf-8'))
        print('8. Point Cloud:', resp.status, 'pc_id =', pc_res['id'])
        pc_id = pc_res['id']

    # 10. Test mesh
    req = urllib.request.Request(f'{BASE_URL}/reconstruct/mesh', data=body, headers={'Content-Type': f'multipart/form-data; boundary={boundary}'})
    with urllib.request.urlopen(req) as resp:
        print('9. Mesh:', resp.status)

    # 11. Test flythrough path
    boundary, body = multipart_encode({'project_id': str(project_id), 'point_cloud_id': str(pc_id), 'num_frames': '30'}, {})
    req = urllib.request.Request(f'{BASE_URL}/flythrough/path', data=body, headers={'Content-Type': f'multipart/form-data; boundary={boundary}'})
    with urllib.request.urlopen(req) as resp:
        print('10. Flythrough Path:', resp.status)

    # 12. Test report
    req = urllib.request.Request(f'{BASE_URL}/reports/{project_id}')
    with urllib.request.urlopen(req) as resp:
        rep = json.loads(resp.read().decode('utf-8'))
        print('11. Report:', resp.status, 'Project Status:', rep['project_id'])

    print('\nALL 11 PIPELINE STAGES WITH WEBP SATELLITE IMAGE COMPLETED 100% SUCCESSFULLY!')

if __name__ == '__main__':
    main()
