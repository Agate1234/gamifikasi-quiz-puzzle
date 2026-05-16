import React, { useState } from "react";
import { Form, Input, Button, Card, Typography } from "antd";
import handleSignIn from "../../utils/auth/SignIn";

export default function SignIn() {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await handleSignIn(values);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
      <Card style={{ width: 380 }}>
        <Typography.Title level={4}>Sign In</Typography.Title>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email wajib diisi" },
              { type: "email", message: "Format email tidak valid" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Password wajib diisi" }]}
          >
            <Input.Password />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={loading}>
            Login
          </Button>
        </Form>
      </Card>
    </div>
  );
}