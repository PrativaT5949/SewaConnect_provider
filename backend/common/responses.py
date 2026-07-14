from rest_framework.response import Response


def success_response(data=None, message='Success', status=200):
    payload = {'status': 'success', 'message': message}
    if data is not None:
        payload['data'] = data
    return Response(payload, status=status)


def error_response(message='Error occurred', errors=None, status=400):
    payload = {'status': 'error', 'message': message}
    if errors is not None:
        payload['errors'] = errors
    return Response(payload, status=status)
