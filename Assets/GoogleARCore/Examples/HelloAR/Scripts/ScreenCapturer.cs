using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using GoogleARCore;
using GoogleARCore.Examples.ComputerVision;
using GoogleARCore.Examples.Common;
using System;
using UnityEngine.Networking;


public class ScreenCapturer : MonoBehaviour
{

    public Text debugText;
    CameraImageBytes bytes;

    private static byte[] s_ImageBuffer = new byte[0];
    private static int s_ImageBufferSize = 0;
    private Texture2D m_TextureToRender;


    // Start is called before the first frame update
    void Start()
    {
        debugText.text = "False";

        //TextureReaderComponent.OnImageAvailableCallback += OnImageAvailable;
    }

    // Update is called once per frame
    void Update()
    {
        //bytes = Frame.CameraImage.AcquireCameraImageBytes();
        //debugText.text = bytes.IsAvailable.ToString();
        using (var image = Frame.CameraImage.AcquireCameraImageBytes())
        {
            if (image.IsAvailable)
            {
                // Adjust buffer size if necessary.
                int bufferSize = image.UVRowStride * image.Height;
                if (bufferSize != s_ImageBufferSize || s_ImageBuffer.Length == 0)
                {
                    s_ImageBufferSize = bufferSize;
                    s_ImageBuffer = new byte[bufferSize];
                }

                this.m_TextureToRender = new Texture2D(image.UVRowStride, image.Height, TextureFormat.RGBA32, false, false);

                // Move raw data into managed buffer.
                System.Runtime.InteropServices.Marshal.Copy(image.Y, s_ImageBuffer, 0, bufferSize);

                m_TextureToRender.LoadRawTextureData(s_ImageBuffer);
                m_TextureToRender.Apply();

                var encodedJpg = m_TextureToRender.EncodeToJPG();
                string base64encoded = Convert.ToBase64String(encodedJpg);

                StartCoroutine(SendData(image.UVRowStride, image.Height, base64encoded));

                // TODO: Send s_ImageBuffer, UVRowStride, and Height to back end
                // debugText.text = bufferSize.ToString();
                //List<IMultipartFormSection> formData = new List<IMultipartFormSection>();
                //formData.Add(new MultipartFormDataSection("field1=foo&field2=bar"));
                //formData.Add(new MultipartFormFileSection("my file data", "myfile.txt"));


            }
            else
            {
                return;
            }

        }

    }

    IEnumerator SendData(int Width, int Height, string image)
    {
        Dictionary<string, string> form = new Dictionary<string, string>();
        form["width"] = Width.ToString();
        form["height"] = Height.ToString();
        form["image"] = image;

        //List<IMultipartFormSection> formData = new List<IMultipartFormSection>();
        //formData.Add(new MultipartFormDataSection("width=" + UVRowStride + "&height=" + Height + "&imageByteArray=" + Convert.ToBase64String(s_ImageBuffer)));

        UnityWebRequest www = UnityWebRequest.Post("http://35.236.108.192:5000/test", form);

        yield return www.SendWebRequest();
        if (www.isNetworkError || www.isHttpError)
        {
            debugText.text = (www.error).ToString();
        }
        else
        {
            debugText.text = www.downloadHandler.text;
        }
    }

    private void OnImageAvailable(TextureReaderApi.ImageFormatType format, int width, int height, IntPtr pixelBuffer, int bufferSize)
    {
        debugText.text = "True";
    }
}
